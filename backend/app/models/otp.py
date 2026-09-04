import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class OtpChannel(str, enum.Enum):
    email = "email"
    phone = "phone"


class OtpPurpose(str, enum.Enum):
    registration = "registration"
    login = "login"


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    identifier: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    channel: Mapped[OtpChannel] = mapped_column(Enum(OtpChannel), nullable=False)
    purpose: Mapped[OtpPurpose] = mapped_column(Enum(OtpPurpose), nullable=False)
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
