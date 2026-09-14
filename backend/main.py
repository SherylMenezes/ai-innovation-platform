from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models import challenge, evaluation, gamification, otp, user 
from app.routers import ai as ai_router
from app.routers import auth
from app.routers import challenges as challenges_router  
from app.routers import evaluation as evaluation_router
from app.routers import gamification as gamification_router
from app.routers import user as user_router
from app.services.gamification_listeners import register_gamification_listeners


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    register_gamification_listeners()
    yield


app = FastAPI(title="AI Innovation Platform", lifespan=lifespan)

# Wide open for local frontend dev (Vite default port). Tighten before deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user_router.router)
app.include_router(ai_router.router)
app.include_router(challenges_router.router) 
app.include_router(gamification_router.router)
app.include_router(evaluation_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}