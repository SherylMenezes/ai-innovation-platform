import os
import uuid

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

import pytest
from fastapi.testclient import TestClient

from app.core.database import Base, engine
from main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def _unique_email() -> str:
    return f"user-{uuid.uuid4().hex[:8]}@example.com"


def test_full_signup_login_rbac_flow():
    email = _unique_email()

    gen_resp = client.post(
        "/api/auth/otp/generate",
        json={"identifier": email, "channel": "email", "purpose": "registration"},
    )
    assert gen_resp.status_code == 200, gen_resp.text
    code = gen_resp.json()["debug_code"]
    assert code is not None

    verify_resp = client.post(
        "/api/auth/otp/verify",
        json={"identifier": email, "channel": "email", "purpose": "registration", "code": code},
    )
    assert verify_resp.status_code == 200, verify_resp.text
    assert verify_resp.json()["verified"] is True

    register_resp = client.post(
        "/api/auth/register",
        json={"name": "Riya Shetgaonkar", "email": email, "phone": None, "channel": "email", "code": code},
    )
    assert register_resp.status_code == 200, register_resp.text
    register_body = register_resp.json()
    assert register_body["email"] == email
    assert register_body["role"] == "student"
    assert register_body["academic_tier"] == "Graduate"
    assert register_body["is_verified"] is True

    login_gen_resp = client.post(
        "/api/auth/otp/generate",
        json={"identifier": email, "channel": "email", "purpose": "login"},
    )
    assert login_gen_resp.status_code == 200, login_gen_resp.text
    login_code = login_gen_resp.json()["debug_code"]
    assert login_code is not None

    login_resp = client.post(
        "/api/auth/login",
        json={"identifier": email, "channel": "email", "code": login_code},
    )
    assert login_resp.status_code == 200, login_resp.text
    token_body = login_resp.json()
    assert token_body["token_type"] == "bearer"
    access_token = token_body["access_token"]
    assert access_token

    rbac_resp = client.get(
        "/api/user/rbac", headers={"Authorization": f"Bearer {access_token}"}
    )
    assert rbac_resp.status_code == 200, rbac_resp.text
    rbac_body = rbac_resp.json()
    assert rbac_body["user_id"] == register_body["user_id"]
    assert rbac_body["role"] == "student"
    assert rbac_body["academic_tier"] == "Graduate"
    assert "project:view" in rbac_body["permissions"]


def test_wrong_otp_is_rejected():
    email = _unique_email()

    client.post(
        "/api/auth/otp/generate",
        json={"identifier": email, "channel": "email", "purpose": "registration"},
    )

    verify_resp = client.post(
        "/api/auth/otp/verify",
        json={"identifier": email, "channel": "email", "purpose": "registration", "code": "000000"},
    )
    assert verify_resp.status_code == 400


def test_rbac_without_token_returns_401():
    resp = client.get("/api/user/rbac")
    assert resp.status_code == 401

# Day 5 Test Case for Epic 1.2 (Tier Selection & Profile Update)
def test_tier_selection_and_profile_update_flow():
    email = _unique_email()

    gen_resp = client.post(
        "/api/auth/otp/generate",
        json={"identifier": email, "channel": "email", "purpose": "registration"},
    )
    code = gen_resp.json()["debug_code"]

    client.post(
        "/api/auth/otp/verify",
        json={"identifier": email, "channel": "email", "purpose": "registration", "code": code},
    )

    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Sheryl Menezes",
            "email": email,
            "phone": None,
            "channel": "email",
            "code": code,
            "academic_tier": "Grade 8-10",
            "institution_name": "Sharada Mandir School"
        },
    )
    assert reg_resp.status_code == 200, reg_resp.text
    reg_body = reg_resp.json()
    assert reg_body["academic_tier"] == "Grade 8-10"
    assert reg_body["institution_name"] == "Sharada Mandir School"

    login_gen = client.post(
        "/api/auth/otp/generate",
        json={"identifier": email, "channel": "email", "purpose": "login"},
    )
    login_code = login_gen.json()["debug_code"]

    login_resp = client.post(
        "/api/auth/login",
        json={"identifier": email, "channel": "email", "code": login_code},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    rbac_resp = client.get("/api/user/rbac", headers=headers)
    assert rbac_resp.status_code == 200, rbac_resp.text
    assert rbac_resp.json()["academic_tier"] == "Grade 8-10"

    update_resp = client.put(
        "/api/user/profile",
        headers=headers,
        json={"academic_tier": "Professional", "institution_name": "Persistent Goa"},
    )
    assert update_resp.status_code == 200, update_resp.text
    updated_body = update_resp.json()
    assert updated_body["academic_tier"] == "Professional"
    assert updated_body["institution_name"] == "Persistent Goa"

    get_profile_resp = client.get("/api/user/profile", headers=headers)
    assert get_profile_resp.status_code == 200, get_profile_resp.text
    assert get_profile_resp.json()["academic_tier"] == "Professional"
    assert get_profile_resp.json()["institution_name"] == "Persistent Goa"