from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models import otp, user  # noqa: F401 — import so tables register on Base
from app.routers import auth, user as user_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI Innovation Platform — Auth Service", lifespan=lifespan)

# Wide open for local frontend dev (Vite default port). Tighten before deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(user_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
