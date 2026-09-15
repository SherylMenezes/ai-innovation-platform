import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class IdeationNote(Base):
    """One sticky note on a user's Ideation Board. Freeform position (x/y),
    SCAMPER column assignment (technique), and Mind Map view all read off
    this same row — the board's three view modes are just different
    layouts over one note list, not separate data."""

    __tablename__ = "ideation_notes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    text: Mapped[str] = mapped_column(String(4000), nullable=False, default="")
    color: Mapped[str] = mapped_column(String(32), nullable=False, default="sunshine")
    x: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    y: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    technique: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
