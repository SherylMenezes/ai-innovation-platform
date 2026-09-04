from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.integrations.email import send_otp_email
from app.integrations.sms import send_otp_sms
from app.models.otp import OtpChannel, OtpPurpose
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    OtpGenerateRequest,
    OtpGenerateResponse,
    OtpVerifyRequest,
    OtpVerifyResponse,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.services import otp_service
from config import settings
from security import create_access_token, create_refresh_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _dispatch_otp(identifier: str, channel: OtpChannel, code: str) -> None:
    if channel == OtpChannel.email:
        send_otp_email(identifier, code)
    else:
        send_otp_sms(identifier, code)


@router.post("/otp/generate", response_model=OtpGenerateResponse)
def generate_otp(payload: OtpGenerateRequest, db: Session = Depends(get_db)):
    channel = OtpChannel(payload.channel)
    purpose = OtpPurpose(payload.purpose)

    try:
        otp, code = otp_service.create_otp(db, payload.identifier, channel, purpose)
    except otp_service.OtpCooldownError as exc:
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, str(exc))

    _dispatch_otp(payload.identifier, channel, code)

    debug_code = code if (channel == OtpChannel.email and settings.email_provider == "mock") or (
        channel == OtpChannel.phone and settings.sms_provider == "mock"
    ) else None

    return OtpGenerateResponse(
        message="OTP sent.",
        expires_in_seconds=settings.otp_ttl_seconds,
        debug_code=debug_code,
    )


@router.post("/otp/verify", response_model=OtpVerifyResponse)
def verify_otp(payload: OtpVerifyRequest, db: Session = Depends(get_db)):
    channel = OtpChannel(payload.channel)
    purpose = OtpPurpose(payload.purpose)

    try:
        otp_service.verify_otp(db, payload.identifier, channel, purpose, payload.code, consume=False)
    except (
        otp_service.OtpInvalidError,
        otp_service.OtpExpiredError,
        otp_service.OtpMaxAttemptsError,
    ) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    return OtpVerifyResponse(verified=True, message="OTP verified.")


@router.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    channel = OtpChannel(payload.channel)
    identifier = payload.email if channel == OtpChannel.email else payload.phone
    if not identifier:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"{payload.channel} is required when channel is '{payload.channel}'."
        )

    existing = db.execute(
        select(User).where(
            ((User.email == payload.email) & (payload.email is not None))
            | ((User.phone == payload.phone) & (payload.phone is not None))
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email or phone is already registered.")

    try:
        otp_service.verify_otp(
            db, identifier, channel, OtpPurpose.registration, payload.code, consume=True
        )
    except (
        otp_service.OtpInvalidError,
        otp_service.OtpExpiredError,
        otp_service.OtpMaxAttemptsError,
    ) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        role="student",
        is_verified=True,
        hashed_password=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        is_verified=user.is_verified,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    channel = OtpChannel(payload.channel)

    try:
        otp_service.verify_otp(
            db, payload.identifier, channel, OtpPurpose.login, payload.code, consume=True
        )
    except (
        otp_service.OtpInvalidError,
        otp_service.OtpExpiredError,
        otp_service.OtpMaxAttemptsError,
    ) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    column = User.email if channel == OtpChannel.email else User.phone
    user = db.execute(select(User).where(column == payload.identifier)).scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No account found for this identifier.")

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
