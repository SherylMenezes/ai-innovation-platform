from contextlib import asynccontextmanager
from dotenv import load_dotenv
load_dotenv()  # This loads the variables from your .env file into Python's environment
import os

from dotenv import load_dotenv

# Must run before any module reads os.getenv() at call time — e.g.
# llm_service.py's _get_client() reads GEMINI_API_KEY straight from the
# process environment, which pydantic-settings' own .env loading (in
# app/config.py) never populates; only python-dotenv does that.
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import Base, SessionLocal, engine
from app.models import challenge, evaluation, gamification, ideation, mentor, notification, otp, user
from app.seed_data import seed_badges, seed_challenges

from app.routers import (
    ai as ai_router,
    auth,
    challenges as challenges_router,
    dashboard as dashboard_router,
    evaluation as evaluation_router,
    gamification as gamification_router,
    ideation as ideation_router,
    notification as notification_router,
    user as user_router,
    submissions,
)
from app.services.gamification_listeners import register_gamification_listeners

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create all tables in SQLite / PostgreSQL
    Base.metadata.create_all(bind=engine)
    # Register event-driven gamification hooks
    register_gamification_listeners()
    # Seed demo challenges on first run (no-op once the table has rows)
    db = SessionLocal()
    try:
        seed_challenges(db)
        seed_badges(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="AI Innovation Platform API",
    description="Backend API for AI-Powered Gamified Project-Based Learning & Innovation Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(auth.router)
app.include_router(user_router.router)
app.include_router(ai_router.router)
app.include_router(challenges_router.router)
app.include_router(dashboard_router.router)
app.include_router(gamification_router.router)
app.include_router(evaluation_router.router)
app.include_router(ideation_router.router)
app.include_router(notification_router.router)

# Resolve path relative to backend root directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
frontend_path = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend"))

if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")


@app.get("/")
def serve_canvas():
    if os.path.exists(frontend_path):
        index_file = os.path.join(frontend_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
    return {"status": "backend running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(submissions.router)