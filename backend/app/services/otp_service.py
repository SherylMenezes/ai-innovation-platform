import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.otp import OtpChannel, OtpCode, OtpPurpose
from app.config import settings


class OtpCooldownError(Exception):
    """Raised when a resend is requested before the cooldown window elapses."""


class OtpInvalidError(Exception):
    """Raised when no matching/pending OTP exists or the submitted code is wrong."""


class OtpExpiredError(Exception):
    """Raised when the matching OTP has passed its expiry."""


class OtpMaxAttemptsError(Exception):
    """Raised when the matching OTP has exhausted its allowed attempts."""


def generate_code(length: int | None = None) -> str:
    length = length or settings.otp_length
    return "".join(secrets.choice("0123456789") for _ in range(length))


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _latest_otp(db: Session, identifier: str, channel: OtpChannel, purpose: OtpPurpose) -> OtpCode | None:
    stmt = (
        select(OtpCode)
        .where(
            OtpCode.identifier == identifier,
            OtpCode.channel == channel,
            OtpCode.purpose == purpose,
        )
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    )
    return db.execute(stmt).scalar_one_or_none()


def create_otp(db: Session, identifier: str, channel: OtpChannel, purpose: OtpPurpose) -> tuple[OtpCode, str]:
    last = _latest_otp(db, identifier, channel, purpose)
    if last is not None:
        created_at = last.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - created_at).total_seconds()
        remaining = settings.otp_resend_cooldown_seconds - elapsed
        if remaining > 0:
            raise OtpCooldownError(f"Please wait {int(remaining)}s before requesting another code.")

    code = generate_code()
    now = datetime.now(timezone.utc)
    otp = OtpCode(
        identifier=identifier,
        channel=channel,
        purpose=purpose,
        code_hash=_hash_code(code),
        attempts=0,
        is_used=False,
        created_at=now,
        expires_at=now + timedelta(seconds=settings.otp_ttl_seconds),
    )
    db.add(otp)
    db.commit()
    return otp, code


def verify_otp(
    db: Session,
    identifier: str,
    channel: OtpChannel,
    purpose: OtpPurpose,
    code: str,
    consume: bool = True,
    commit: bool = True,
) -> OtpCode:
    """commit=False leaves marking the OTP used to the caller's own
    commit, so e.g. registration consumes the code and creates the user
    atomically in one round trip. Failed attempts are always committed
    immediately — the attempt limit must hold even if the caller aborts."""
    stmt = (
        select(OtpCode)
        .where(
            OtpCode.identifier == identifier,
            OtpCode.channel == channel,
            OtpCode.purpose == purpose,
            OtpCode.is_used.is_(False),
        )
        .order_by(OtpCode.created_at.desc())
        .limit(1)
    )
    otp = db.execute(stmt).scalar_one_or_none()
    if otp is None:
        raise OtpInvalidError("No pending OTP found. Please request a new code.")

    expires_at = otp.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise OtpExpiredError("OTP has expired. Please request a new code.")

    if otp.attempts >= settings.otp_max_attempts:
        raise OtpMaxAttemptsError("Maximum verification attempts exceeded. Please request a new code.")

    if _hash_code(code) != otp.code_hash:
        otp.attempts += 1
        db.commit()
        raise OtpInvalidError("Invalid OTP code.")

    if consume:
        otp.is_used = True
        if commit:
            db.commit()

    return otp
