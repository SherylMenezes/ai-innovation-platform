from typing import Literal

from pydantic import BaseModel

Channel = Literal["email", "phone"]
Purpose = Literal["registration", "login"]


class OtpGenerateRequest(BaseModel):
    identifier: str
    channel: Channel
    purpose: Purpose


class OtpGenerateResponse(BaseModel):
    message: str
    expires_in_seconds: int
    # Only populated when the active provider is "mock", so local/dev/test
    # flows can complete without a real SMS/email being sent.
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
    name: str
    email: str | None = None
    phone: str | None = None
    channel: Channel
    code: str


class RegisterResponse(BaseModel):
    user_id: str
    name: str
    email: str | None
    phone: str | None
    role: str
    is_verified: bool


class LoginRequest(BaseModel):
    identifier: str
    channel: Channel
    code: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
