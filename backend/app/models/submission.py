from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    file_url = Column(String(500), nullable=False)
    repository_url = Column(String(500), nullable=True)
    status = Column(String(50), default="submitted")  # submitted, evaluating, evaluated
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    scorecard = relationship("Scorecard", back_populates="submission", uselist=False)


class Scorecard(Base):
    __tablename__ = "scorecards"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), unique=True, nullable=False)
    innovation_score = Column(Float, nullable=False)
    feasibility_score = Column(Float, nullable=False)
    impact_score = Column(Float, nullable=False)
    overall_score = Column(Float, nullable=False)
    feedback = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    submission = relationship("Submission", back_populates="scorecard")