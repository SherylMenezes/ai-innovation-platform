from typing import Literal, Optional

from pydantic import BaseModel, Field

from app.models.user import AcademicTier
from app.schemas.user import UserProfileResponse


Channel = Literal["email", "phone"]
Purpose = Literal["registration", "login"]


class OtpGenerateRequest(BaseModel):
    identifier: str
    channel: Channel
    purpose: Purpose


class OtpGenerateResponse(BaseModel):
    message: str
    expires_in_seconds: int
    # Only populated when the active provider is "mock".
    debug_code: str | None = None


class OtpVerifyRequest(BaseModel):
    identifier: str
    channel: Channel
    purpose: Purpose
    code: str


class OtpVerifyResponse(BaseModel):
    verified: bool
    message: str


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: str
    password: str = Field(..., min_length=8, max_length=128)
    channel: Literal["email"] = "email"
    code: str = Field(..., min_length=4, max_length=10)
    academic_tier: Optional[AcademicTier] = AcademicTier.GRADUATE
    institution_name: Optional[str] = None


class RegisterResponse(BaseModel):
    user_id: str
    name: str
    email: str | None
    phone: str | None
    role: str
    is_verified: bool
    academic_tier: str
    institution_name: Optional[str] = None

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=1, max_length=128)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserProfileResponse] = None