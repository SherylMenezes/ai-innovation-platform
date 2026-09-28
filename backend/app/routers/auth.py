import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
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
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
)
from app.schemas.user import UserProfileResponse
from app.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.services import otp_service


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)


def _dispatch_otp(
    identifier: str,
    channel: OtpChannel,
    code: str,
) -> None:
    try:
        if channel == OtpChannel.email:
            send_otp_email(identifier, code)
        else:
            send_otp_sms(identifier, code)
    except Exception:
        logger.exception(
            "Failed to deliver %s OTP to %s",
            channel.value,
            identifier,
        )


@router.post(
    "/otp/generate",
    response_model=OtpGenerateResponse,
)
def generate_otp(
    payload: OtpGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    channel = OtpChannel(payload.channel)
    purpose = OtpPurpose(payload.purpose)

    try:
        otp, code = otp_service.create_otp(
            db,
            payload.identifier,
            channel,
            purpose,
        )
    except otp_service.OtpCooldownError as exc:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            str(exc),
        )

    background_tasks.add_task(
        _dispatch_otp,
        payload.identifier,
        channel,
        code,
    )

    debug_code = (
        code
        if (
            channel == OtpChannel.email
            and settings.email_provider == "mock"
        )
        or (
            channel == OtpChannel.phone
            and settings.sms_provider == "mock"
        )
        else None
    )

    return OtpGenerateResponse(
        message="OTP sent.",
        expires_in_seconds=settings.otp_ttl_seconds,
        debug_code=debug_code,
    )


@router.post(
    "/otp/verify",
    response_model=OtpVerifyResponse,
)
def verify_otp(
    payload: OtpVerifyRequest,
    db: Session = Depends(get_db),
):
    channel = OtpChannel(payload.channel)
    purpose = OtpPurpose(payload.purpose)

    try:
        otp_service.verify_otp(
            db,
            payload.identifier,
            channel,
            purpose,
            payload.code,
            consume=False,
        )
    except (
        otp_service.OtpInvalidError,
        otp_service.OtpExpiredError,
        otp_service.OtpMaxAttemptsError,
    ) as exc:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            str(exc),
        )

    return OtpVerifyResponse(
        verified=True,
        message="OTP verified.",
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()

    existing = db.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if existing is not None:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Email is already registered.",
        )

    try:
        otp_service.verify_otp(
            db,
            email,
            OtpChannel.email,
            OtpPurpose.registration,
            payload.code,
            consume=True,
            commit=False,
        )
    except (
        otp_service.OtpInvalidError,
        otp_service.OtpExpiredError,
        otp_service.OtpMaxAttemptsError,
    ) as exc:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            str(exc),
        )

    tier_value = (
        payload.academic_tier.value
        if payload.academic_tier
        else "Graduate"
    )

    user = User(
        name=payload.name.strip(),
        email=email,
        phone=None,
        role="student",
        academic_tier=tier_value,
        institution_name=(
            payload.institution_name.strip()
            if payload.institution_name
            else None
        ),
        is_verified=True,
        hashed_password=hash_password(payload.password),
    )

    db.add(user)
    db.flush()

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    response = RegisterResponse(
        user_id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        academic_tier=user.academic_tier,
        institution_name=user.institution_name,
        is_verified=user.is_verified,
        access_token=access_token,
        refresh_token=refresh_token,
    )

    db.commit()

    return response


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.strip().lower()

    user = db.execute(
        select(User).where(User.email == email)
    ).scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password.",
        )

    if not user.is_verified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Please verify your email before logging in.",
        )

    if not verify_password(
        payload.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password.",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfileResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
)
def refresh(
    payload: RefreshTokenRequest,
    db: Session = Depends(get_db),
):
    token_payload = decode_token(payload.refresh_token)

    if token_payload.get("type") != "refresh":
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Expected a refresh token.",
        )

    user_id = token_payload.get("sub")

    if not user_id:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid refresh token.",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "User not found.",
        )

    if not user.is_verified:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "User email is not verified.",
        )

    access_token = create_access_token(user.id)

    # Rotate the refresh token as well.
    refresh_token = create_refresh_token(user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfileResponse.model_validate(user),
    )