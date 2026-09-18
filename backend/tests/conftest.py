import os

# IMPORTANT:
# Set the test database BEFORE importing anything from app.
# app.config/settings and the SQLAlchemy engine are initialized
# during imports, so this must come first.
os.environ.setdefault(
    "DATABASE_URL",
    "sqlite:///./test.db",
)

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
    """Create all database tables before tests execute and tear down afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

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
    # Ensure all tables exist for the current test database instance
    Base.metadata.create_all(bind=engine)

    db = next(get_db())
    try:
        email = "testuser@example.com"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name="Test Student",
                role="student",
                academic_tier="Graduate",
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        token = create_access_token(user_id=str(user.id))
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()