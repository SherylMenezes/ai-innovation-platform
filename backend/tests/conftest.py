import uuid
import pytest

from fastapi.testclient import TestClient

from app.main import app
from app.security import create_access_token
from app.database import Base, engine, get_db
from app.models.user import User


# ---------------------------------------------------------
# CREATE DATABASE TABLES BEFORE TESTS
# ---------------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)

    yield


# ---------------------------------------------------------
# FASTAPI TEST CLIENT
# ---------------------------------------------------------

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------
# AUTHENTICATED TEST USER
# ---------------------------------------------------------

@pytest.fixture(scope="function")
def auth_headers():
    db = next(get_db())

    try:
        email = "testuser@example.com"

        # Look for existing test user
        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        # Create test user if it does not exist
        if user is None:
            user = User(
                id=str(uuid.uuid4()),
                name="Test User",
                email=email,
                role="student",
            )

            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token(user_id=str(user.id))

        return {
            "Authorization": f"Bearer {token}"
        }

    finally:
        db.close()