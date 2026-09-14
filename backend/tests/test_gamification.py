import asyncio
import os
from datetime import datetime, timedelta, timezone

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_gamification.db")

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.core.redis_client import redis_client
from app.models.gamification import UserGamificationProfile
from app.models.user import User
from app.services.event_broker import GamificationEvent, event_broker
from app.services.gamification_listeners import register_gamification_listeners
from app.services.gamification_service import (
    UserNotFoundError,
    award_xp,
    record_streak_checkin,
)
from app.main import app
from app.security import create_access_token

# Explicit, idempotent registration — TestClient() without a `with` block
# doesn't run FastAPI's lifespan, so main.py's own registration call never
# fires under test. event_broker.on() de-dupes, so this is safe to run
# once here regardless of what lifespan does elsewhere.
register_gamification_listeners()

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _run_async(coro):
    # Every call here gets its own fresh event loop via asyncio.run().
    # redis_client is a module-level singleton shared across all of them,
    # so a connection it opened under a previous loop is invalid the
    # instant that loop closes ("Event loop is closed" on reuse). Only
    # reachable when a real Redis/Memurai server is running; against a
    # real server, reset() discards any such stale connections before
    # they can be reused, without trying to gracefully close them (which
    # is exactly what would raise). Test-harness plumbing only — real
    # usage (uvicorn) has exactly one event loop for the server's entire
    # lifetime, so production never hits this.
    redis_client.connection_pool.reset()
    return asyncio.run(coro)


def _create_user(role="student", name="Test User"):
    db = SessionLocal()
    try:
        user = User(name=name, email=f"{name.lower().replace(' ', '.')}@example.com", role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _auth_headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def _post(*args, **kwargs):
    # TestClient (used without a `with` block here, matching test_e2e.py's
    # existing convention) drives each request through its own internal
    # event loop per call too — the same stale-connection hazard as
    # _run_async, so it needs the same reset immediately beforehand.
    redis_client.connection_pool.reset()
    return client.post(*args, **kwargs)


def _run_award_xp(user_id, points, source_event, metadata=None):
    db = SessionLocal()
    try:
        return _run_async(award_xp(db, user_id, points, source_event, metadata))
    finally:
        db.close()


def _run_streak_checkin(user_id):
    db = SessionLocal()
    try:
        return _run_async(record_streak_checkin(db, user_id))
    finally:
        db.close()


# ---- award_xp service (Day 2 core logic) ----

def test_award_xp_persists_and_accumulates():
    user = _create_user()

    first = _run_award_xp(user.id, 25, "TASK_COMPLETED")
    assert first.total_xp == 25
    assert first.points_awarded == 25

    second = _run_award_xp(user.id, 10, "TASK_COMPLETED")
    assert second.total_xp == 35


def test_award_xp_rejects_non_positive_points():
    user = _create_user()
    with pytest.raises(ValueError):
        _run_award_xp(user.id, 0, "TASK_COMPLETED")


def test_award_xp_unknown_user_raises():
    with pytest.raises(UserNotFoundError):
        _run_award_xp("does-not-exist", 10, "TASK_COMPLETED")


def test_award_xp_writes_audit_transaction_metadata():
    user = _create_user()
    result = _run_award_xp(user.id, 20, "CHALLENGE_SUBMITTED", metadata={"challenge_id": "c-1"})
    assert result.source_event == "CHALLENGE_SUBMITTED"
    assert result.transaction_id


# ---- streak logic ----

def test_streak_checkin_first_time_sets_streak_to_one():
    user = _create_user()
    result = _run_streak_checkin(user.id)
    assert result.current_streak == 1
    assert result.extended is True


def test_streak_checkin_same_day_is_noop():
    user = _create_user()
    _run_streak_checkin(user.id)
    result = _run_streak_checkin(user.id)
    assert result.current_streak == 1
    assert result.extended is False


def test_streak_checkin_consecutive_day_extends():
    user = _create_user()
    db = SessionLocal()
    db.add(
        UserGamificationProfile(
            user_id=user.id, current_streak=3, longest_streak=3, last_checkin_date=datetime.now(timezone.utc).date() - timedelta(days=1)
        )
    )
    db.commit()
    db.close()

    result = _run_streak_checkin(user.id)
    assert result.current_streak == 4
    assert result.longest_streak == 4


def test_streak_checkin_gap_resets_but_keeps_longest():
    user = _create_user()
    db = SessionLocal()
    db.add(
        UserGamificationProfile(
            user_id=user.id, current_streak=5, longest_streak=5, last_checkin_date=datetime.now(timezone.utc).date() - timedelta(days=3)
        )
    )
    db.commit()
    db.close()

    result = _run_streak_checkin(user.id)
    assert result.current_streak == 1
    assert result.longest_streak == 5


# ---- HTTP endpoint RBAC (Day 2) ----

def test_award_xp_endpoint_requires_auth():
    resp = _post(
        "/api/gamification/award-xp",
        json={"user_id": "x", "points": 10, "source_event": "TASK_COMPLETED"},
    )
    assert resp.status_code == 401


def test_award_xp_endpoint_forbidden_for_student():
    student = _create_user(role="student", name="Student Caller")
    target = _create_user(role="student", name="Target User")
    resp = _post(
        "/api/gamification/award-xp",
        json={"user_id": target.id, "points": 10, "source_event": "TASK_COMPLETED"},
        headers=_auth_headers(student),
    )
    assert resp.status_code == 403


def test_award_xp_endpoint_allows_admin():
    admin = _create_user(role="admin", name="Admin Caller")
    target = _create_user(role="student", name="Target User")
    resp = _post(
        "/api/gamification/award-xp",
        json={
            "user_id": target.id,
            "points": 15,
            "source_event": "TASK_COMPLETED",
            "metadata": {"task_id": "t1"},
        },
        headers=_auth_headers(admin),
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total_xp"] == 15
    assert body["user_id"] == target.id
    assert body["current_streak"] == 0


def test_award_xp_endpoint_allows_mentor():
    mentor = _create_user(role="mentor", name="Mentor Caller")
    target = _create_user(role="student", name="Target User")
    resp = _post(
        "/api/gamification/award-xp",
        json={"user_id": target.id, "points": 5, "source_event": "TASK_COMPLETED"},
        headers=_auth_headers(mentor),
    )
    assert resp.status_code == 200, resp.text


def test_award_xp_endpoint_rejects_non_positive_points():
    admin = _create_user(role="admin", name="Admin Caller")
    target = _create_user(role="student", name="Target User")
    resp = _post(
        "/api/gamification/award-xp",
        json={"user_id": target.id, "points": 0, "source_event": "TASK_COMPLETED"},
        headers=_auth_headers(admin),
    )
    assert resp.status_code == 422


def test_award_xp_endpoint_unknown_target_user_returns_404():
    admin = _create_user(role="admin", name="Admin Caller")
    resp = _post(
        "/api/gamification/award-xp",
        json={"user_id": "does-not-exist", "points": 10, "source_event": "TASK_COMPLETED"},
        headers=_auth_headers(admin),
    )
    assert resp.status_code == 404


# ---- event broker integration (Day 3) ----

def test_task_completed_event_awards_configured_xp():
    user = _create_user()
    _run_async(
        event_broker.emit(GamificationEvent.TASK_COMPLETED, {"user_id": user.id, "metadata": {"task_id": "abc"}})
    )

    db = SessionLocal()
    profile = db.get(UserGamificationProfile, user.id)
    db.close()
    assert profile.total_xp == 10  # REWARD_RULES[TASK_COMPLETED]


def test_challenge_submitted_event_awards_configured_xp():
    user = _create_user()
    _run_async(event_broker.emit(GamificationEvent.CHALLENGE_SUBMITTED, {"user_id": user.id}))

    db = SessionLocal()
    profile = db.get(UserGamificationProfile, user.id)
    db.close()
    assert profile.total_xp == 50  # REWARD_RULES[CHALLENGE_SUBMITTED]


def test_streak_checkin_event_updates_streak_and_awards_xp():
    user = _create_user()
    _run_async(event_broker.emit(GamificationEvent.STREAK_CHECKIN, {"user_id": user.id}))

    db = SessionLocal()
    profile = db.get(UserGamificationProfile, user.id)
    db.close()
    assert profile.current_streak == 1
    assert profile.total_xp == 5  # REWARD_RULES[STREAK_CHECKIN]


def test_unknown_event_type_is_ignored_not_errored():
    user = _create_user()
    # No reward rule and no listener for this type — emit() should just
    # no-op, not raise.
    _run_async(event_broker.emit("UNKNOWN_EVENT", {"user_id": user.id}))


def test_event_for_unknown_user_does_not_crash_the_broker():
    # A malformed/unknown user_id should be logged and skipped, not raise
    # out of emit() and take down whatever code path triggered the event.
    _run_async(event_broker.emit(GamificationEvent.TASK_COMPLETED, {"user_id": "ghost-user"}))
