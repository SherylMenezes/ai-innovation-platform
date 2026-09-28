from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ChallengeBase(BaseModel):
    title: str
    domain: str  # Matches category in UI (Healthcare, Agriculture, etc.)
    difficulty: str
    description: str
    constraints: List[str] = []
    learning_tier: Optional[str] = None


class ChallengeCreate(ChallengeBase):
    pass


class ChallengeResponse(ChallengeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: Optional[datetime] = None
    created_by_id: Optional[int] = None


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    challenge_id: int
    status: str
    enrolled_at: datetime