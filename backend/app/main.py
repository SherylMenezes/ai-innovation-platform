from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.routers.ai import router as ai_router
from app.routers.auth import router as auth_router
from app.routers.user import router as user_router
from app.routers.dashboard import router as dashboard_router

app = FastAPI(
    title="AI Innovation Platform API",
    description="Backend API for AI-Powered Gamified Project-Based Learning & Innovation Platform",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(ai_router)
app.include_router(dashboard_router)

# Mount frontend directory
frontend_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend")
if os.path.exists(frontend_path):
    app.mount("/static", StaticFiles(directory=frontend_path), name="static")

@app.get("/")
def serve_canvas():
    index_file = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"status": "backend running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}