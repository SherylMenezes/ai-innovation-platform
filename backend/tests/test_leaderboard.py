import asyncio

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.core.redis_client import redis_client
from app.main import app
from app.models.user import User
from app.security import create_access_token
from app.services.gamification_service import award_xp

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _run_async(coro):
    # See test_gamification.py for why this reset is needed: redis_client
    # is a module-level singleton and each asyncio.run() here gets its
    # own event loop.
    redis_client.connection_pool.reset()
    return asyncio.run(coro)


def _create_user(role="student", name="Test User", institution=None, academic_tier="Graduate"):
    db = SessionLocal()
    try:
        user = User(
            name=name,
            email=f"{name.lower().replace(' ', '.')}@example.com",
            role=role,
            institution_name=institution,
            academic_tier=academic_tier,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def _auth_headers(user):
    return {"Authorization": f"Bearer {create_access_token(user.id)}"}


def _give_xp(user, points):
    db = SessionLocal()
    try:
        _run_async(award_xp(db, user.id, points, "TASK_COMPLETED"))
    finally:
        db.close()


def test_leaderboard_requires_auth():
    resp = client.get("/api/gamification/leaderboard")
    assert resp.status_code == 401


def test_global_leaderboard_ranks_by_xp_descending():
    low = _create_user(name="Low Xp")
    high = _create_user(name="High Xp")
    mid = _create_user(name="Mid Xp")
    _give_xp(low, 10)
    _give_xp(high, 100)
    _give_xp(mid, 50)

    resp = client.get("/api/gamification/leaderboard?scope=global", headers=_auth_headers(high))
    assert resp.status_code == 200
    entries = resp.json()["entries"]
    assert [e["name"] for e in entries] == ["High Xp", "Mid Xp", "Low Xp"]
    assert [e["rank"] for e in entries] == [1, 2, 3]


def test_user_with_no_gamification_activity_still_appears_at_zero_xp():
    active = _create_user(name="Active User")
    idle = _create_user(name="Idle User")
    _give_xp(active, 20)

    resp = client.get("/api/gamification/leaderboard?scope=global", headers=_auth_headers(active))
    entries = resp.json()["entries"]
    idle_entry = next(e for e in entries if e["name"] == "Idle User")
    assert idle_entry["xp"] == 0


def test_your_rank_is_reported_even_outside_the_page_limit():
    leader = _create_user(name="Leader")
    trailing = _create_user(name="Trailing Student")
    _give_xp(leader, 999)
    _give_xp(trailing, 1)

    resp = client.get("/api/gamification/leaderboard?scope=global&limit=1", headers=_auth_headers(trailing))
    body = resp.json()
    assert len(body["entries"]) == 1
    assert body["entries"][0]["name"] == "Leader"
    assert body["your_rank"] == 2
    assert body["your_entry"]["name"] == "Trailing Student"


def test_institution_scope_only_includes_same_institution():
    same_school_a = _create_user(name="Same School A", institution="PCCE")
    same_school_b = _create_user(name="Same School B", institution="PCCE")
    other_school = _create_user(name="Other School", institution="Other College")
    _give_xp(same_school_a, 10)
    _give_xp(same_school_b, 20)
    _give_xp(other_school, 999)

    resp = client.get("/api/gamification/leaderboard?scope=institution", headers=_auth_headers(same_school_a))
    body = resp.json()
    names = {e["name"] for e in body["entries"]}
    assert names == {"Same School A", "Same School B"}
    assert body["scope_value"] == "PCCE"


def test_institution_scope_without_institution_set_is_rejected():
    user = _create_user(name="No Institution", institution=None)
    resp = client.get("/api/gamification/leaderboard?scope=institution", headers=_auth_headers(user))
    assert resp.status_code == 400


def test_class_scope_filters_by_academic_tier():
    grad_a = _create_user(name="Grad A", academic_tier="Graduate")
    grad_b = _create_user(name="Grad B", academic_tier="Graduate")
    school_kid = _create_user(name="School Kid", academic_tier="Grade 8-10")
    _give_xp(grad_a, 5)
    _give_xp(school_kid, 999)

    resp = client.get("/api/gamification/leaderboard?scope=class", headers=_auth_headers(grad_a))
    body = resp.json()
    names = {e["name"] for e in body["entries"]}
    assert names == {"Grad A", "Grad B"}
    assert body["scope_value"] == "Graduate"


def test_non_students_are_excluded_from_the_leaderboard():
    student = _create_user(name="Student One", role="student")
    mentor = _create_user(name="Mentor One", role="mentor")
    _give_xp(mentor, 999)

    resp = client.get("/api/gamification/leaderboard?scope=global", headers=_auth_headers(student))
    names = {e["name"] for e in resp.json()["entries"]}
    assert "Mentor One" not in names


def test_unknown_scope_is_rejected():
    user = _create_user()
    resp = client.get("/api/gamification/leaderboard?scope=galaxy", headers=_auth_headers(user))
    assert resp.status_code == 422
