import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.security import create_access_token
from app.database import Base, engine, get_db

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Cleanup after test suite finishes if needed

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
def auth_headers():
    test_user_payload = {
        "sub": "testuser@example.com",
        "user_id": 1,
        "role": "student",
        "tier": "Graduate"
    }
    token = create_access_token(data=test_user_payload)
    return {"Authorization": f"Bearer {token}"}