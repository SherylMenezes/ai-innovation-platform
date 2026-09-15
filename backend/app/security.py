"""
JWT/session logic. Access and refresh tokens are both HS256 JWTs signed
with JWT_SECRET_KEY. get_current_user() decodes the bearer token and loads
the corresponding user; require_role() layers RBAC on top of that.
"""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

ROLE_PERMISSIONS: dict[str, list[str]] = {
    "student": ["project:view", "project:submit", "leaderboard:view"],
    "mentor": ["project:view", "project:review", "leaderboard:view", "student:feedback"],
    "admin": [
        "project:view",
        "project:review",
        "project:manage",
        "leaderboard:view",
        "user:manage",
        "student:feedback",
    ],
}


def get_permissions(role: str) -> list[str]:
    return ROLE_PERMISSIONS.get(role, [])


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(
        user_id, timedelta(minutes=settings.access_token_expire_minutes), "access"
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        user_id, timedelta(days=settings.refresh_token_expire_days), "refresh"
    )


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    if token is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token.")

    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Expected an access token.")

    user_id = payload.get("sub")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found.")

    return user


def require_role(*roles: str):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions.")
        return current_user

    return dependency
