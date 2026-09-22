"""Per-(user, challenge) project workspace: Enrollment carries the stage
pointer and freeform per-stage state (canvas_state/evaluation_state), so
Problem Canvas / Ideation Board / Idea Evaluation can all resume exactly
where a student left off instead of losing progress on refresh."""
from sqlalchemy.orm import Session

from app.models.challenge import Challenge, Enrollment
from app.models.submission import Submission
from app.services.event_broker import GamificationEvent, event_broker
from app.services.gamification_listeners import REWARD_RULES

STAGE_ORDER = ["canvas", "ideation", "evaluation", "submission", "completed"]


class WorkspaceNotFoundError(Exception):
    pass


class WorkspaceLockedError(Exception):
    pass


def get_enrollment(db: Session, user_id: str, challenge_id: int) -> Enrollment:
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id, Enrollment.challenge_id == challenge_id)
        .first()
    )
    if enrollment is None:
        raise WorkspaceNotFoundError("Not enrolled in this challenge.")
    return enrollment


def get_workspace_data(db: Session, user_id: str, challenge_id: int) -> dict:
    enrollment = get_enrollment(db, user_id, challenge_id)
    challenge = db.get(Challenge, challenge_id)
    submission = (
        db.query(Submission)
        .filter(Submission.challenge_id == challenge_id, Submission.user_id == user_id)
        .order_by(Submission.created_at.desc())
        .first()
    )
    return {
        "challenge": challenge,
        "status": enrollment.status,
        "current_stage": enrollment.current_stage,
        "canvas_state": enrollment.canvas_state or {},
        "evaluation_state": enrollment.evaluation_state or {},
        "completed_steps": enrollment.completed_steps or [],
        "submission": submission,
    }


async def _mark_step_complete(db: Session, enrollment: Enrollment, step_key: str) -> int:
    """Idempotent: returns XP awarded (0 if this step was already credited)."""
    completed = list(enrollment.completed_steps or [])
    if step_key in completed:
        return 0

    completed.append(step_key)
    enrollment.completed_steps = completed
    db.commit()

    await event_broker.emit(
        GamificationEvent.WORKSPACE_STEP_COMPLETED,
        {"user_id": enrollment.user_id, "metadata": {"step": step_key, "challenge_id": enrollment.challenge_id}},
    )
    return REWARD_RULES.get(GamificationEvent.WORKSPACE_STEP_COMPLETED, 0)


def _ensure_editable(enrollment: Enrollment) -> None:
    if enrollment.status == "completed":
        raise WorkspaceLockedError("This challenge is already completed and can no longer be edited.")


async def save_canvas_state(
    db: Session, user_id: str, challenge_id: int, canvas_state: dict, mark_step_complete: str | None
) -> tuple[Enrollment, int]:
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)

    enrollment.canvas_state = canvas_state
    db.commit()

    xp_awarded = 0
    if mark_step_complete:
        xp_awarded = await _mark_step_complete(db, enrollment, mark_step_complete)

    db.refresh(enrollment)
    return enrollment, xp_awarded


async def save_evaluation_state(
    db: Session, user_id: str, challenge_id: int, evaluation_state: dict, mark_step_complete: str | None
) -> tuple[Enrollment, int]:
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)

    enrollment.evaluation_state = evaluation_state
    db.commit()

    xp_awarded = 0
    if mark_step_complete:
        xp_awarded = await _mark_step_complete(db, enrollment, mark_step_complete)

    db.refresh(enrollment)
    return enrollment, xp_awarded


async def complete_step(db: Session, user_id: str, challenge_id: int, step_key: str) -> tuple[Enrollment, int]:
    """For stages with no JSON state blob of their own (Ideation Board's
    "state" is its IdeationNote rows, not a field on Enrollment) — same
    idempotent XP-crediting path as save_canvas_state/save_evaluation_state,
    just without a state payload to persist alongside it."""
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)
    xp_awarded = await _mark_step_complete(db, enrollment, step_key)
    db.refresh(enrollment)
    return enrollment, xp_awarded


def advance_stage(db: Session, user_id: str, challenge_id: int) -> Enrollment:
    enrollment = get_enrollment(db, user_id, challenge_id)
    _ensure_editable(enrollment)

    try:
        idx = STAGE_ORDER.index(enrollment.current_stage)
    except ValueError:
        idx = 0

    # "completed" is only ever set by the evaluation-completion path
    # (see evaluation_job_service), never by a plain stage advance.
    if idx < len(STAGE_ORDER) - 2:
        enrollment.current_stage = STAGE_ORDER[idx + 1]
        db.commit()
        db.refresh(enrollment)

    return enrollment


def list_enrolled(db: Session, user_id: str) -> list[Enrollment]:
    return (
        db.query(Enrollment)
        .filter(Enrollment.user_id == user_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
