import time

import pytest
from fastapi.testclient import TestClient

from app.database import Base, SessionLocal, engine
from app.main import app
from app.models.challenge import Challenge
from app.models.submission import Submission
from app.models.user import User
from app.security import create_access_token

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


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


def _create_submission(owner):
    db = SessionLocal()
    try:
        challenge = Challenge(
            title="Reduce Food Waste for Local Restaurants",
            domain="AI/ML",
            difficulty="Intermediate",
            description="An AI system that predicts daily demand to cut food waste.",
        )
        db.add(challenge)
        db.commit()
        db.refresh(challenge)

        submission = Submission(
            challenge_id=challenge.id,
            user_id=owner.id,
            file_url="https://example.com/submission.pdf",
            status="submitted",
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission
    finally:
        db.close()


def _wait_for_scorecard(submission_id, headers, timeout_seconds=5):
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        resp = client.get(f"/api/submissions/{submission_id}/scorecard", headers=headers)
        if resp.status_code == 200:
            return resp
        time.sleep(0.05)
    pytest.fail(f"Submission {submission_id} never got a scorecard within {timeout_seconds}s")


def test_evaluate_triggers_async_job_and_returns_202():
    owner = _create_user()
    submission = _create_submission(owner)

    resp = client.post(f"/api/submissions/{submission.id}/evaluate", headers=_auth_headers(owner))
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["submission_id"] == submission.id
    assert body["job_id"]


def test_evaluate_populates_scorecard_and_marks_submission_evaluated():
    owner = _create_user()
    submission = _create_submission(owner)

    client.post(f"/api/submissions/{submission.id}/evaluate", headers=_auth_headers(owner))
    scorecard_resp = _wait_for_scorecard(submission.id, _auth_headers(owner))

    card = scorecard_resp.json()
    assert card["submission_id"] == submission.id
    assert card["feasibility_score"] > 0
    assert card["impact_score"] > 0
    assert card["overall_score"] > 0

    status_resp = client.get(f"/api/submissions/{submission.id}/status", headers=_auth_headers(owner))
    assert status_resp.json()["status"] == "evaluated"


def test_evaluate_requires_ownership():
    owner = _create_user(name="Owner")
    other = _create_user(name="Other Student")
    submission = _create_submission(owner)

    resp = client.post(f"/api/submissions/{submission.id}/evaluate", headers=_auth_headers(other))
    assert resp.status_code == 403


def test_evaluate_unknown_submission_is_404():
    user = _create_user()
    resp = client.post("/api/submissions/999999/evaluate", headers=_auth_headers(user))
    assert resp.status_code == 404


def test_evaluate_requires_auth():
    owner = _create_user()
    submission = _create_submission(owner)
    resp = client.post(f"/api/submissions/{submission.id}/evaluate")
    assert resp.status_code == 401
