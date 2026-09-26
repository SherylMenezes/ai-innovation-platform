"""Auth round-trip savings: OTP delivery off the request path, signup that
signs straight in, login that returns the profile, and read-only requests
on an autocommit session."""
import pytest
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.database import Base, SessionLocal, autocommit_engine, engine, get_db
from app.main import app
from app.models.otp import OtpChannel, OtpCode, OtpPurpose
from app.routers import auth as auth_router
from app.services import otp_service

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def sent_codes(monkeypatch):
    """Never reach real Twilio/SendGrid from tests; record what would be sent."""
    sent = []
    monkeypatch.setattr(auth_router, "send_otp_email", lambda to, code: sent.append((to, code)))
    monkeypatch.setattr(auth_router, "send_otp_sms", lambda to, code: sent.append((to, code)))
    return sent


def _issue_code(identifier, purpose):
    db = SessionLocal()
    try:
        _, code = otp_service.create_otp(db, identifier, OtpChannel.email, purpose)
        return code
    finally:
        db.close()


def _register(email="fast.signup@example.com"):
    code = _issue_code(email, OtpPurpose.registration)
    return client.post(
        "/api/auth/register",
        json={"name": "Fast Signup", "email": email, "channel": "email", "code": code},
    )


def test_generate_delivers_code_via_background_task(sent_codes):
    resp = client.post(
        "/api/auth/otp/generate",
        json={"identifier": "bg@example.com", "channel": "email", "purpose": "login"},
    )
    assert resp.status_code == 200
    assert [to for to, _ in sent_codes] == ["bg@example.com"]


def test_generate_succeeds_even_if_provider_fails(monkeypatch):
    def boom(to, code):
        raise RuntimeError("provider down")

    monkeypatch.setattr(auth_router, "send_otp_email", boom)
    resp = client.post(
        "/api/auth/otp/generate",
        json={"identifier": "down@example.com", "channel": "email", "purpose": "login"},
    )
    assert resp.status_code == 200


def test_register_signs_user_straight_in():
    resp = _register()
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["access_token"] and body["refresh_token"]

    profile = client.get("/api/user/profile", headers={"Authorization": f"Bearer {body['access_token']}"})
    assert profile.status_code == 200
    assert profile.json()["id"] == body["user_id"]


def test_register_consumes_the_code_with_the_user_insert():
    _register()
    db = SessionLocal()
    try:
        otp = db.query(OtpCode).filter(OtpCode.identifier == "fast.signup@example.com").one()
        assert otp.is_used is True
    finally:
        db.close()


def test_login_returns_the_profile():
    _register()
    code = _issue_code("fast.signup@example.com", OtpPurpose.login)
    resp = client.post(
        "/api/auth/login", json={"identifier": "fast.signup@example.com", "channel": "email", "code": code}
    )
    assert resp.status_code == 200, resp.text
    user = resp.json()["user"]
    assert user["email"] == "fast.signup@example.com"
    assert user["name"] == "Fast Signup"


def _session_for(method):
    request = Request({"type": "http", "method": method, "headers": []})
    generator = get_db(request)
    db = next(generator)
    try:
        return db.get_bind()
    finally:
        generator.close()


def test_read_requests_use_autocommit_session():
    assert _session_for("GET") is autocommit_engine
    assert _session_for("POST") is engine
    # Direct callers (scripts, tests) keep a transactional session.
    generator = get_db()
    assert next(generator).get_bind() is engine
    generator.close()
