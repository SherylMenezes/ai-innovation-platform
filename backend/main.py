# Entrypoint for `uvicorn main:app --reload` run from backend/. The real
# app lives in app/main.py — re-exported here instead of duplicated so the
# two can't drift out of sync with each other.

from app.main import app

__all__ = ["app"]
