from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class ChallengeBase(BaseModel):
    title: str
    domain: str
    difficulty: str
    description: str
    constraints: List[str] = []
    learning_tier: Optional[str] = None

class ChallengeResponse(ChallengeBase):
    model_config = ConfigDict(from_attributes=True)

class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)