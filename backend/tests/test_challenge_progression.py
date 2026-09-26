"""Challenge Levels, XP payouts, player Rank and submission badges."""
import asyncio

import pytest
from fastapi.testclient import TestClient

from app.core.redis_client import redis_client
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models.challenge import Challenge, Enrollment
from app.models.evaluation import EvaluationJob
from app.models.gamification import Badge, UserBadge, UserGamificationProfile
from app.models.ideation import IdeationNote
from app.models.notification import Notification
from app.models.submission import Submission
from app.models.user import User
from app.seed_data import seed_badges
from app.security import create_access_token
from app.services import xp_rules
from app.services.evaluation_job_service import _complete_enrollment_and_reward
from app.services.player_rank import rank_for_xp

client = TestClient(app)

CANVAS_STEPS = ["canvas_step_1", "canvas_step_2", "canvas_step_3", "canvas_step_4"]


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_badges(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=engine)


def _request(method, *args, **kwargs):
    # Same stale-connection guard as test_gamification.py: every TestClient
    # call runs on its own event loop.
    redis_client.connection_pool.reset()
    return getattr(client, method)(*args, **kwargs)


def _setup(difficulty="Beginner", stage="canvas"):
    db = SessionLocal()
    try:
        user = User(name="Level Player", email="level.player@example.com", role="student")
        challenge = Challenge(title="Food Waste", domain="AI/ML", difficulty=difficulty, description="Reduce waste.")
        db.add_all([user, challenge])
        db.commit()
        enrollment = Enrollment(user_id=user.id, challenge_id=challenge.id, current_stage=stage)
        db.add(enrollment)
        db.commit()
        headers = {"Authorization": f"Bearer {create_access_token(user.id)}"}
        return user.id, challenge.id, headers
    finally:
        db.close()


def _total_xp(user_id):
    db = SessionLocal()
    try:
        profile = db.get(UserGamificationProfile, user_id)
        return profile.total_xp if profile else 0
    finally:
        db.close()


def _complete_step(challenge_id, headers, step_key):
    return _request(
        "post", f"/api/challenges/{challenge_id}/workspace/complete-step", json={"step_key": step_key}, headers=headers
    )


def _advance(challenge_id, headers, stage=None):
    body = {"stage": stage} if stage else None
    return _request("post", f"/api/challenges/{challenge_id}/workspace/advance-stage", json=body, headers=headers)


# ---- step XP ----

def test_step_pays_its_configured_xp_once():
    user_id, challenge_id, headers = _setup()

    first = _complete_step(challenge_id, headers, "canvas_step_2")
    assert first.status_code == 200, first.text
    assert first.json()["xp_awarded"] == 15
    assert first.json()["total_xp"] == 15

    again = _complete_step(challenge_id, headers, "canvas_step_2")
    assert again.json()["xp_awarded"] == 0
    assert _total_xp(user_id) == 15


def test_unknown_step_key_is_rejected_and_pays_nothing():
    user_id, challenge_id, headers = _setup()
    resp = _complete_step(challenge_id, headers, "made_up_step")
    assert resp.status_code == 400
    assert _total_xp(user_id) == 0


def test_step_from_a_locked_level_is_rejected():
    user_id, challenge_id, headers = _setup(stage="canvas")
    resp = _complete_step(challenge_id, headers, "eval_complete")
    assert resp.status_code == 409
    assert _total_xp(user_id) == 0


def test_difficulty_scales_step_xp():
    _, challenge_id, headers = _setup(difficulty="Advanced")
    resp = _complete_step(challenge_id, headers, "canvas_step_2")
    assert resp.json()["xp_awarded"] == 22  # round(15 * 1.5)


def test_ideation_complete_requires_a_note():
    user_id, challenge_id, headers = _setup(stage="ideation")
    assert _complete_step(challenge_id, headers, "ideation_complete").status_code == 409

    db = SessionLocal()
    db.add(IdeationNote(user_id=user_id, challenge_id=challenge_id, text="Pre-orders"))
    db.commit()
    db.close()

    resp = _complete_step(challenge_id, headers, "ideation_complete")
    assert resp.status_code == 200
    assert resp.json()["xp_awarded"] == 20


# ---- Level progression ----

def test_level_cannot_be_cleared_until_its_steps_are_done():
    _, challenge_id, headers = _setup()
    _complete_step(challenge_id, headers, "canvas_step_1")

    resp = _advance(challenge_id, headers, "canvas")
    assert resp.status_code == 409
    assert "Level 1" in resp.json()["detail"]


def test_clearing_a_level_pays_bonus_and_unlocks_next():
    user_id, challenge_id, headers = _setup()
    for step in CANVAS_STEPS:
        _complete_step(challenge_id, headers, step)

    resp = _advance(challenge_id, headers, "canvas")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["current_stage"] == "ideation"
    assert body["xp_awarded"] == xp_rules.LEVEL_CLEAR_XP
    assert body["cleared_level"] == {"number": 1, "name": "Problem Canvas"}
    assert _total_xp(user_id) == 5 + 15 + 15 + 10 + 20


def test_advancing_from_an_earlier_level_is_a_noop():
    _, challenge_id, headers = _setup(stage="ideation")
    resp = _advance(challenge_id, headers, "canvas")
    assert resp.status_code == 200
    assert resp.json()["current_stage"] == "ideation"
    assert resp.json()["xp_awarded"] == 0


def test_workspace_reports_level_progress():
    _, challenge_id, headers = _setup()
    for step in CANVAS_STEPS:
        _complete_step(challenge_id, headers, step)
    _advance(challenge_id, headers, "canvas")

    progress = _request("get", f"/api/challenges/{challenge_id}/workspace", headers=headers).json()["progress"]
    assert progress["current_level"] == 2
    assert progress["current_level_name"] == "Ideation Board"
    assert progress["levels_completed"] == 1
    assert [level["status"] for level in progress["levels"]] == ["completed", "current", "locked", "locked"]
    assert progress["levels"][0]["xp_earned"] == progress["levels"][0]["xp_available"] == 65

    enrolled = _request("get", "/api/challenges/enrolled", headers=headers).json()["items"]
    assert enrolled[0]["progress"]["current_level"] == 2


# ---- submission (Level 4) ----

def test_cannot_submit_before_reaching_level_4():
    _, challenge_id, headers = _setup(stage="evaluation")
    resp = _request(
        "post", "/api/submissions", data={"challenge_id": challenge_id, "repository_url": "https://github.com/x/y"},
        headers=headers,
    )
    assert resp.status_code == 409


def test_submission_xp_is_paid_once():
    user_id, challenge_id, headers = _setup(stage="submission")
    form = {"challenge_id": challenge_id, "repository_url": "https://github.com/x/y"}

    first = _request("post", "/api/submissions", data=form, headers=headers)
    assert first.status_code == 201, first.text
    assert first.json()["xp_awarded"] == xp_rules.SUBMISSION_XP

    second = _request("post", "/api/submissions", data=form, headers=headers)
    assert second.status_code == 201
    assert second.json()["xp_awarded"] == 0
    assert _total_xp(user_id) == xp_rules.SUBMISSION_XP


def _make_submission(user_id, challenge_id, status="submitted"):
    db = SessionLocal()
    try:
        submission = Submission(challenge_id=challenge_id, user_id=user_id, file_url="", status=status)
        db.add(submission)
        db.commit()
        return submission.id
    finally:
        db.close()


def test_evaluated_submission_cannot_be_re_evaluated():
    user_id, challenge_id, headers = _setup(stage="submission")
    submission_id = _make_submission(user_id, challenge_id, status="evaluated")
    resp = _request("post", f"/api/submissions/{submission_id}/evaluate", headers=headers)
    assert resp.status_code == 409


def test_evaluation_already_in_flight_is_rejected():
    user_id, challenge_id, headers = _setup(stage="submission")
    submission_id = _make_submission(user_id, challenge_id)
    db = SessionLocal()
    db.add(EvaluationJob(requested_by=user_id, title="t", description="d", submission_id=submission_id))
    db.commit()
    db.close()

    resp = _request("post", f"/api/submissions/{submission_id}/evaluate", headers=headers)
    assert resp.status_code == 409


# ---- evaluation rewards + badges ----

def _run_completion(submission_id, score):
    db = SessionLocal()
    try:
        redis_client.connection_pool.reset()
        asyncio.run(_complete_enrollment_and_reward(db, submission_id, score))
    finally:
        db.close()


def _badge_slugs(user_id):
    db = SessionLocal()
    try:
        return {ub.badge.slug for ub in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()}
    finally:
        db.close()


def test_evaluation_pays_score_xp_badges_and_completes_challenge():
    user_id, challenge_id, headers = _setup(stage="submission")
    submission_id = _make_submission(user_id, challenge_id, status="evaluated")

    _run_completion(submission_id, 17.0)

    # 17 * 5 + 25 pass bonus, then badge bonuses 25 (completer) + 50 (high achiever)
    assert _total_xp(user_id) == 110 + 25 + 50
    assert _badge_slugs(user_id) == {"challenge_completer", "high_achiever"}

    db = SessionLocal()
    enrollment = db.query(Enrollment).filter(Enrollment.user_id == user_id).one()
    notifications = db.query(Notification).filter(Notification.user_id == user_id).all()
    db.close()
    assert enrollment.status == "completed"
    assert sum(n.notification_type == "badge" for n in notifications) == 2

    workspace = _request("get", f"/api/challenges/{challenge_id}/workspace", headers=headers).json()
    assert {b["slug"] for b in workspace["badges_earned"]} == {"challenge_completer", "high_achiever"}
    assert workspace["progress"]["is_completed"] is True
    assert workspace["progress"]["levels_completed"] == 4


def test_evaluation_rewards_are_not_paid_twice():
    user_id, challenge_id, _ = _setup(stage="submission")
    submission_id = _make_submission(user_id, challenge_id, status="evaluated")

    _run_completion(submission_id, 19.5)
    after_first = _total_xp(user_id)
    _run_completion(submission_id, 19.5)

    assert _total_xp(user_id) == after_first
    assert _badge_slugs(user_id) == {"challenge_completer", "high_achiever", "perfectionist"}


def test_low_score_still_earns_completer_badge_without_pass_bonus():
    user_id, challenge_id, _ = _setup(stage="submission")
    submission_id = _make_submission(user_id, challenge_id, status="evaluated")

    _run_completion(submission_id, 8.0)

    assert _total_xp(user_id) == 8 * 5 + 25  # score XP + completer badge, no pass bonus
    assert _badge_slugs(user_id) == {"challenge_completer"}


# ---- player Rank ----

@pytest.mark.parametrize(
    "xp,rank,title",
    [(0, 1, "Explorer"), (99, 1, "Explorer"), (100, 2, "Thinker"), (300, 3, "Problem Solver"), (1000, 5, "Builder")],
)
def test_rank_thresholds(xp, rank, title):
    info = rank_for_xp(xp)
    assert (info.rank, info.title) == (rank, title)


def test_rank_progress_within_rank():
    info = rank_for_xp(150)  # Rank 2 spans 100..300
    assert info.xp_into_rank == 50
    assert info.xp_for_next_rank == 200
    assert info.progress_percent == 25.0


def test_ranking_up_sends_a_notification_and_shows_in_stats():
    user_id, challenge_id, headers = _setup(stage="submission")
    submission_id = _make_submission(user_id, challenge_id, status="evaluated")
    _run_completion(submission_id, 17.0)  # 185 XP -> Rank 2

    db = SessionLocal()
    rank_ups = db.query(Notification).filter(
        Notification.user_id == user_id, Notification.notification_type == "rank_up"
    ).count()
    db.close()
    assert rank_ups == 1

    stats = _request("get", "/api/gamification/user-stats", headers=headers).json()
    assert stats["rank"]["rank"] == 2
    assert stats["rank"]["title"] == "Thinker"

    overview = _request("get", "/api/dashboard/overview", headers=headers).json()
    assert overview["rank"]["rank"] == 2

    history = _request("get", "/api/gamification/xp-history", headers=headers).json()["items"]
    assert {item["source_event"] for item in history} == {"CHALLENGE_EVALUATED", "BADGE_EARNED"}
