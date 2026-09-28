"""Per-(user, challenge) project workspace: Enrollment carries the stage
pointer and freeform per-stage state (canvas_state/evaluation_state), so
Problem Canvas / Ideate / Idea Evaluation can all resume exactly
where a student left off instead of losing progress on refresh.

Each stage is one Level of the challenge (see xp_rules.CHALLENGE_LEVELS).
Every challenge XP payout goes through award_once(), which records a
reward key in Enrollment.completed_steps in the same commit as the XP —
so re-saving a step, resubmitting, or re-running an evaluation never
pays twice."""
from collections import defaultdict
from dataclasses import dataclass

from sqlalchemy.orm import Session, joinedload

from app.models.challenge import Challenge, Enrollment
from app.models.gamification import Badge, XPTransaction
from app.models.submission import Submission
from app.services import xp_rules
from app.services.gamification_service import AwardXpResult, award_xp

STAGE_ORDER = ["canvas", "ideation", "evaluation", "submission", "completed"]


class WorkspaceNotFoundError(Exception):
    pass


class WorkspaceLockedError(Exception):
    pass


class InvalidStepError(Exception):
    pass


class LevelIncompleteError(Exception):
    pass


@dataclass
class RewardSummary:
    xp_awarded: int = 0
    total_xp: int | None = None
    cleared_level: dict | None = None

    def add(self, result: AwardXpResult | None) -> None:
        if result is not None:
            self.xp_awarded += result.points_awarded
            self.total_xp = result.total_xp


def _stage_index(stage: str) -> int:
    try:
        return STAGE_ORDER.index(stage)
    except ValueError:
        return 0


def get_enrollment(db: Session, user_id: str, challenge_id: int) -> Enrollment:
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id, Enrollment.challenge_id == challenge_id)
        .first()
    )
    if enrollment is None:
        raise WorkspaceNotFoundError("Not enrolled in this challenge.")
    return enrollment


async def award_once(
    db: Session,
    enrollment: Enrollment,
    reward_key: str,
    base_points: int,
    source_event: str,
    stage: str,
    extra_metadata: dict | None = None,
) -> AwardXpResult | None:
    """Pays base_points (scaled by challenge difficulty) the first time
    reward_key is seen for this enrollment; returns None if it was already
    paid. The row lock serialises concurrent requests on Postgres (SQLite
    ignores FOR UPDATE), and award_xp's commit persists the reward key and
    the XP together."""
    locked = (
        db.query(Enrollment)
        .filter(Enrollment.id == enrollment.id)
        .with_for_update()
        .populate_existing()
        .one()
    )
    completed = list(locked.completed_steps or [])
    if reward_key in completed:
        db.commit()  # release the row lock
        return None

    completed.append(reward_key)
    locked.completed_steps = completed

    difficulty = locked.challenge.difficulty if locked.challenge else None
    points = xp_rules.scale(base_points, difficulty)
    if points <= 0:
        db.commit()
        return None

    metadata = {
        "challenge_id": locked.challenge_id,
        "stage": stage,
        "reward_key": reward_key,
        **(extra_metadata or {}),
    }
    try:
        return await award_xp(db, locked.user_id, points, source_event, metadata)
    except Exception:
        db.rollback()
        raise


def _transaction_stage(row: XPTransaction) -> str | None:
    metadata = row.event_metadata or {}
    if metadata.get("stage"):
        return metadata["stage"]
    # Rows written before stages were recorded in metadata.
    step = metadata.get("step")
    if step in xp_rules.STEP_XP:
        return xp_rules.STEP_XP[step][0]
    if row.source_event == "CHALLENGE_SUBMITTED":
        return "submission"
    return None


def _xp_ledger_by_challenge(db: Session, user_id: str) -> dict[int, list[XPTransaction]]:
    rows = (
        db.query(XPTransaction)
        .filter(XPTransaction.user_id == user_id)
        .order_by(XPTransaction.created_at.asc())
        .all()
    )
    by_challenge: dict[int, list[XPTransaction]] = defaultdict(list)
    for row in rows:
        challenge_id = (row.event_metadata or {}).get("challenge_id")
        if isinstance(challenge_id, int):
            by_challenge[challenge_id].append(row)
    return by_challenge


def build_challenge_progress(
    enrollment: Enrollment, challenge: Challenge | None, transactions: list[XPTransaction]
) -> dict:
    """Level-by-level view of one challenge: which Level the student is
    on, and XP earned vs. available per Level. Badge bonus XP is left out
    of the Level totals — it's shown alongside the badges instead."""
    difficulty = challenge.difficulty if challenge else None
    is_completed = enrollment.status == "completed"
    current_idx = _stage_index(enrollment.current_stage)

    earned_by_stage: dict[str, int] = defaultdict(int)
    for row in transactions:
        stage = _transaction_stage(row)
        if stage:
            earned_by_stage[stage] += row.points

    levels = []
    for idx, level in enumerate(xp_rules.CHALLENGE_LEVELS):
        if is_completed or idx < current_idx:
            status = "completed"
        elif idx == current_idx:
            status = "current"
        else:
            status = "locked"
        levels.append(
            {
                **level,
                "status": status,
                "xp_earned": earned_by_stage[level["stage"]],
                "xp_available": xp_rules.level_xp_available(level["stage"], difficulty),
            }
        )

    fallback = xp_rules.CHALLENGE_LEVELS[-1] if is_completed else xp_rules.CHALLENGE_LEVELS[0]
    current = xp_rules.LEVEL_BY_STAGE.get(enrollment.current_stage, fallback)
    return {
        "current_level": current["number"],
        "current_level_name": current["name"],
        "total_levels": xp_rules.TOTAL_LEVELS,
        "levels_completed": sum(1 for level in levels if level["status"] == "completed"),
        "is_completed": is_completed,
        "xp_earned": sum(level["xp_earned"] for level in levels),
        "xp_available": sum(level["xp_available"] for level in levels),
        "levels": levels,
    }


def get_workspace_data(db: Session, user_id: str, challenge_id: int) -> dict:
    # Related rows are joined into the same query (joinedload) rather than
    # lazy-loaded one round trip at a time.
    enrollment = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.challenge))
        .filter(Enrollment.user_id == user_id, Enrollment.challenge_id == challenge_id)
        .first()
    )
    if enrollment is None:
        raise WorkspaceNotFoundError("Not enrolled in this challenge.")
    challenge = enrollment.challenge
    submission = (
        db.query(Submission)
        .options(joinedload(Submission.scorecard))
        .filter(Submission.challenge_id == challenge_id, Submission.user_id == user_id)
        .order_by(Submission.created_at.desc())
        .first()
    )
    transactions = _xp_ledger_by_challenge(db, user_id).get(challenge_id, [])

    badge_slugs = [
        (row.event_metadata or {}).get("badge_slug")
        for row in transactions
        if row.source_event == "BADGE_EARNED"
    ]
    badges_earned = db.query(Badge).filter(Badge.slug.in_(badge_slugs)).all() if badge_slugs else []

    return {
        "challenge": challenge,
        "status": enrollment.status,
        "current_stage": enrollment.current_stage,
        "canvas_state": enrollment.canvas_state or {},
        "evaluation_state": enrollment.evaluation_state or {},
        "completed_steps": enrollment.completed_steps or [],
        "submission": submission,
        "progress": build_challenge_progress(enrollment, challenge, transactions),
        "rewards": [
            {
                "points": row.points,
                "source_event": row.source_event,
                "metadata": row.event_metadata or {},
                "created_at": row.created_at,
            }
            for row in transactions
        ],
        "badges_earned": badges_earned,
    }


def _validate_step(
    db: Session, enrollment: Enrollment, step_key: str, canvas_state: dict | None = None
) -> tuple[str, int]:
    """Returns (stage, base XP) for a creditable step, or raises.
    canvas_state is the state about to be saved, when there is one — it's
    checked in place of the stored state so a save can satisfy its own
    step requirement."""
    rule = xp_rules.STEP_XP.get(step_key)
    if rule is None:
        raise InvalidStepError(f"Unknown step {step_key!r}.")
    stage, base_points = rule

    if _stage_index(stage) > _stage_index(enrollment.current_stage):
        level = xp_rules.LEVEL_BY_STAGE[stage]
        raise WorkspaceLockedError(f"Level {level['number']} ({level['name']}) is still locked.")

    if step_key == "ideation_complete":
        state = canvas_state if canvas_state is not None else (enrollment.canvas_state or {})
        if not state.get("selected_idea"):
            raise LevelIncompleteError("Select an idea to carry forward first.")

    return stage, base_points


async def _mark_step_complete(db: Session, enrollment: Enrollment, step_key: str) -> RewardSummary:
    stage, base_points = _validate_step(db, enrollment, step_key)
    rewards = RewardSummary()
    rewards.add(
        await award_once(
            db, enrollment, step_key, base_points, "WORKSPACE_STEP_COMPLETED", stage, {"step": step_key}
        )
    )
    return rewards


def _ensure_editable(enrollment: Enrollment) -> None:
    if enrollment.status == "completed":
        raise WorkspaceLockedError("This challenge is already completed and can no longer be edited.")


async def save_canvas_state(
    db: Session, user_id: str, challenge_id: int, canvas_state: dict, mark_step_complete: str | None
) -> tuple[Enrollment, RewardSummary]:
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)
    if mark_step_complete:
        _validate_step(db, enrollment, mark_step_complete, canvas_state)

    enrollment.canvas_state = canvas_state
    db.commit()

    rewards = RewardSummary()
    if mark_step_complete:
        rewards = await _mark_step_complete(db, enrollment, mark_step_complete)

    db.refresh(enrollment)
    return enrollment, rewards


async def save_evaluation_state(
    db: Session, user_id: str, challenge_id: int, evaluation_state: dict, mark_step_complete: str | None
) -> tuple[Enrollment, RewardSummary]:
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)
    if mark_step_complete:
        _validate_step(db, enrollment, mark_step_complete)

    enrollment.evaluation_state = evaluation_state
    db.commit()

    rewards = RewardSummary()
    if mark_step_complete:
        rewards = await _mark_step_complete(db, enrollment, mark_step_complete)

    db.refresh(enrollment)
    return enrollment, rewards


async def complete_step(db: Session, user_id: str, challenge_id: int, step_key: str) -> tuple[Enrollment, RewardSummary]:
    """Credits a step without saving any state alongside it — same
    idempotent XP-crediting path as save_canvas_state/save_evaluation_state,
    just without a state payload to persist."""
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)
    rewards = await _mark_step_complete(db, enrollment, step_key)
    db.refresh(enrollment)
    return enrollment, rewards


async def advance_stage(
    db: Session, user_id: str, challenge_id: int, from_stage: str | None = None
) -> tuple[Enrollment, RewardSummary]:
    """Clears the current Level and unlocks the next one. Requires the
    Level's required steps, and pays the Level-clear bonus once.

    from_stage lets a page say which Level it's finishing: if the student
    has already moved past it (revisiting an earlier Level), this is a
    no-op rather than skipping them over the Level they're actually on."""
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)
    rewards = RewardSummary()

    stage = enrollment.current_stage
    if from_stage and from_stage != stage:
        return enrollment, rewards

    # Level 4 (submission) is cleared by its AI evaluation (see
    # evaluation_job_service), never by a plain stage advance.
    required = xp_rules.LEVEL_REQUIRED_STEPS.get(stage)
    if required is None:
        return enrollment, rewards

    level = xp_rules.LEVEL_BY_STAGE[stage]
    completed = enrollment.completed_steps or []
    if any(step not in completed for step in required):
        raise LevelIncompleteError(f"Finish every step of Level {level['number']} ({level['name']}) first.")

    rewards.add(
        await award_once(
            db,
            enrollment,
            xp_rules.level_clear_key(stage),
            xp_rules.LEVEL_CLEAR_XP,
            "LEVEL_CLEARED",
            stage,
            {"level": level["number"]},
        )
    )

    enrollment.current_stage = STAGE_ORDER[_stage_index(stage) + 1]
    db.commit()
    db.refresh(enrollment)
    rewards.cleared_level = {"number": level["number"], "name": level["name"]}
    return enrollment, rewards


def list_enrolled(db: Session, user_id: str) -> list[dict]:
    enrollments = (
        db.query(Enrollment)
        .options(joinedload(Enrollment.challenge))
        .filter(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    ledger = _xp_ledger_by_challenge(db, user_id)
    return [
        {
            "challenge": e.challenge,
            "status": e.status,
            "current_stage": e.current_stage,
            "progress": build_challenge_progress(e, e.challenge, ledger.get(e.challenge_id, [])),
        }
        for e in enrollments
    ]

def get_ai_workspace_context(
    db: Session,
    user_id: str,
    challenge_id: int,
) -> tuple[dict, str]:
    """
    Build a compact workspace context for the AI mentor.

    The context is generated from the user's actual active workspace
    stored in PostgreSQL instead of relying only on context supplied
    by the frontend.
    """
    workspace = get_workspace_data(db, user_id, challenge_id)

    challenge = workspace["challenge"]
    current_stage = workspace["current_stage"]
    status = workspace["status"]
    canvas_state = workspace["canvas_state"]
    evaluation_state = workspace["evaluation_state"]
    completed_steps = workspace["completed_steps"]
    submission = workspace["submission"]

    challenge_context = {
        "id": challenge.id,
        "title": challenge.title,
        "domain": challenge.domain,
        "difficulty": challenge.difficulty,
        "description": challenge.description,
        "learning_tier": challenge.learning_tier,
    }

    submission_context = None

    if submission:
        submission_context = {
            "status": submission.status,
            "file_url": submission.file_url,
            "repository_url": submission.repository_url,
        }

    context_data = {
        "challenge": challenge_context,
        "workspace_status": status,
        "current_stage": current_stage,
        "canvas_state": canvas_state,
        "evaluation_state": evaluation_state,
        "completed_steps": completed_steps,
        "submission": submission_context,
    }

    context_text = (
        f"Challenge: {challenge.title}\n"
        f"Domain: {challenge.domain}\n"
        f"Difficulty: {challenge.difficulty}\n"
        f"Learning Tier: {challenge.learning_tier or 'Not specified'}\n"
        f"Challenge Description: {challenge.description}\n"
        f"Workspace Status: {status}\n"
        f"Current Stage: {current_stage}\n"
        f"Canvas State: {canvas_state}\n"
        f"Evaluation State: {evaluation_state}\n"
        f"Completed Steps: {completed_steps}\n"
        f"Submission: {submission_context}\n"
    )

    return context_data, context_text