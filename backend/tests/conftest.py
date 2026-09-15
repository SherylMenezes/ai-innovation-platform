import os

# Must run before any `app.*` import: app.config's `settings` singleton
# (and the SQLAlchemy `engine` bound to it in app.database) is created on
# first import and never re-reads the environment afterward. Without this,
# every test file's own DATABASE_URL override is a no-op — the whole
# suite silently runs against the real dev database, and test_gamification
# .py's per-test drop_all/create_all wipes it on every run.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")

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
    token = create_access_token(user_id="testuser@example.com")
    return {"Authorization": f"Bearer {token}"}