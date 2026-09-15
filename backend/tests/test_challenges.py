import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security import create_access_token

client = TestClient(app)

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def auth_headers():
    """Generates valid JWT authorization headers for testing authenticated routes."""
    token = create_access_token(user_id="testuser@example.com")
    return {"Authorization": f"Bearer {token}"}

def test_challenge_catalog_flow(client, auth_headers):
    # 1. Filtered Listing
    res = client.get("/api/challenges?domain=AI/ML", headers=auth_headers)
    assert res.status_code == 200

    # 2. Challenge Detail
    challenge_id = 1
    res = client.get(f"/api/challenges/{challenge_id}", headers=auth_headers)
    assert res.status_code in [200, 404]

    # 3. Enroll in Challenge
    if res.status_code == 200:
        enroll_res = client.post(f"/api/challenges/{challenge_id}/enroll", headers=auth_headers)
        assert enroll_res.status_code in [201, 400]