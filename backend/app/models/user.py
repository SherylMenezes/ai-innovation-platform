import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

class AcademicTier(str, enum.Enum):
    GRADE_8_10 = "Grade 8-10"
    GRADE_11_12 = "Grade 11-12"
    GRADUATE = "Graduate"
    PROFESSIONAL = "Professional"

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="student")
    academic_tier: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=AcademicTier.GRADUATE.value,
    )
    institution_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
