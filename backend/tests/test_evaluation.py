import os
import time

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_evaluation.db")

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, SessionLocal, engine
from app.models.evaluation import EvaluationJob
from app.models.user import User
from main import app
from security import create_access_token

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


def _wait_for_completion(job_id, headers, timeout_seconds=5):
    """BackgroundTasks execution timing isn't part of the public contract
    (some Starlette versions run it inline before the test response
    returns, others schedule it right after) — poll briefly instead of
    assuming either way."""
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        resp = client.get(f"/api/evaluation/jobs/{job_id}", headers=headers)
        if resp.json()["status"] in ("completed", "failed"):
            return resp
        time.sleep(0.05)
    pytest.fail(f"Evaluation job {job_id} did not finish within {timeout_seconds}s")


def test_trigger_returns_202_with_pending_job():
    user = _create_user()
    resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "Smart Demand Forecasting", "description": "Predicts demand ahead of time to reduce waste."},
        headers=_auth_headers(user),
    )
    assert resp.status_code == 202, resp.text
    body = resp.json()
    assert body["status"] == "pending"
    assert body["job_id"]


def test_trigger_requires_auth():
    resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "Smart Demand Forecasting", "description": "Predicts demand ahead of time to reduce waste."},
    )
    assert resp.status_code == 401


def test_job_runs_to_completion_with_bundled_scorecard():
    user = _create_user()
    trigger_resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "AI Mentor Chatbot", "description": "A Socratic AI mentor guiding students through design thinking."},
        headers=_auth_headers(user),
    )
    job_id = trigger_resp.json()["job_id"]

    status_resp = _wait_for_completion(job_id, _auth_headers(user))
    body = status_resp.json()
    assert body["status"] == "completed"
    assert body["error_message"] is None
    assert "score" in body["result"]
    assert "risk_analysis" in body["result"]
    assert "swot_analysis" in body["result"]
    assert body["result"]["score"]["title"] == "AI Mentor Chatbot"


def test_status_endpoint_requires_auth():
    user = _create_user()
    trigger_resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "AI Mentor Chatbot", "description": "A Socratic AI mentor guiding students."},
        headers=_auth_headers(user),
    )
    job_id = trigger_resp.json()["job_id"]

    resp = client.get(f"/api/evaluation/jobs/{job_id}")
    assert resp.status_code == 401


def test_status_endpoint_forbidden_for_other_students():
    owner = _create_user(role="student", name="Owner User")
    other = _create_user(role="student", name="Other User")

    trigger_resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "AI Mentor Chatbot", "description": "A Socratic AI mentor guiding students."},
        headers=_auth_headers(owner),
    )
    job_id = trigger_resp.json()["job_id"]

    resp = client.get(f"/api/evaluation/jobs/{job_id}", headers=_auth_headers(other))
    assert resp.status_code == 403


def test_status_endpoint_allows_admin_to_view_any_job():
    owner = _create_user(role="student", name="Owner User")
    admin = _create_user(role="admin", name="Admin User")

    trigger_resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "AI Mentor Chatbot", "description": "A Socratic AI mentor guiding students."},
        headers=_auth_headers(owner),
    )
    job_id = trigger_resp.json()["job_id"]

    resp = client.get(f"/api/evaluation/jobs/{job_id}", headers=_auth_headers(admin))
    assert resp.status_code == 200


def test_unknown_job_id_returns_404():
    user = _create_user()
    resp = client.get("/api/evaluation/jobs/does-not-exist", headers=_auth_headers(user))
    assert resp.status_code == 404


def test_short_title_is_rejected():
    user = _create_user()
    resp = client.post(
        "/api/evaluation/jobs",
        json={"title": "AB", "description": "Predicts demand ahead of time to reduce waste."},
        headers=_auth_headers(user),
    )
    assert resp.status_code == 422
