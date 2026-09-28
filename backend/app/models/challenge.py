from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # =====================================================
    # BASIC INFORMATION
    # =====================================================

    title = Column(
        String(255),
        nullable=False
    )

    domain = Column(
        String(100),
        nullable=False,
        index=True
    )

    difficulty = Column(
        String(50),
        default="Medium"
    )

    description = Column(
        Text,
        nullable=False
    )

    # =====================================================
    # STRUCTURED CHALLENGE INFORMATION
    # =====================================================

    # What is the actual problem?
    problem = Column(
        Text,
        nullable=False,
        default=""
    )

    # Why should this problem be solved?
    why_needed = Column(
        Text,
        nullable=False,
        default=""
    )

    # People/groups affected by the problem
    who_affected = Column(
        JSON,
        nullable=False,
        default=list
    )

    # What should participants achieve?
    goal = Column(
        Text,
        nullable=False,
        default=""
    )

    # =====================================================
    # EXISTING INFORMATION
    # =====================================================

    constraints = Column(
        JSON,
        default=list
    )

    learning_tier = Column(
        String(50),
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    created_by_id = Column(
        String(36),
        nullable=True
    )

    # =====================================================
    # RELATIONSHIPS
    # =====================================================

    enrollments = relationship(
        "Enrollment",
        back_populates="challenge"
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        String(36),
        ForeignKey("users.id"),
        nullable=False
    )

    challenge_id = Column(
        Integer,
        ForeignKey("challenges.id"),
        nullable=False
    )

    status = Column(
        String(50),
        default="active"
    )

    enrolled_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    # =====================================================
    # WORKSPACE
    # =====================================================

    current_stage = Column(
        String(20),
        nullable=False,
        default="canvas"
    )

    canvas_state = Column(
        JSON,
        nullable=True
    )

    evaluation_state = Column(
        JSON,
        nullable=True
    )

    completed_steps = Column(
        JSON,
        nullable=False,
        default=list
    )

    challenge = relationship(
        "Challenge",
        back_populates="enrollments"
    )