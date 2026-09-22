from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False, index=True)  # e.g., AI/ML, Cybersecurity, Web
    difficulty = Column(String(50), default="Medium")          # Beginner, Medium, Advanced
    description = Column(Text, nullable=False)
    constraints = Column(JSON, default=list)                   # List of technical/time constraints
    learning_tier = Column(String(50), nullable=True)          # Tier 1, 2, 3
    created_at = Column(DateTime, default=datetime.utcnow)

    enrollments = relationship("Enrollment", back_populates="challenge")

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    status = Column(String(50), default="active")              # active, completed, abandoned
    enrolled_at = Column(DateTime, default=datetime.utcnow)

    # Per-user-per-challenge workspace: which stage the student is on, the
    # freeform state for each stage, and which step keys already paid out
    # XP (so re-saving a step is idempotent — see workspace_service.py).
    current_stage = Column(String(20), nullable=False, default="canvas")  # canvas, ideation, evaluation, submission, completed
    canvas_state = Column(JSON, nullable=True)
    evaluation_state = Column(JSON, nullable=True)
    completed_steps = Column(JSON, nullable=False, default=list)

    challenge = relationship("Challenge", back_populates="enrollments")