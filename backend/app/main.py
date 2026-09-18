from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.database import Base, engine  
from app.models import challenge, evaluation, gamification, otp, user 

from app.routers import (
    ai as ai_router,
    auth,
    challenges as challenges_router,
    evaluation as evaluation_router,
    gamification as gamification_router,
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
app.include_router(gamification_router.router)
app.include_router(evaluation_router.router)

# Optional: Serve built frontend if present
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(frontend_dist_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")

    @app.get("/")
    def serve_frontend_root():
        index_file = os.path.join(frontend_dist_path, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "backend running"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

app.include_router(submissions.router)