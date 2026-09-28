from datetime import datetime
from typing import List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
)


# =========================================================
# BASE CHALLENGE
# =========================================================

class ChallengeBase(BaseModel):

    # Basic information
    title: str
    domain: str
    difficulty: str
    description: str

    # Structured information
    problem: str = ""
    why_needed: str = ""

    who_affected: List[str] = Field(
        default_factory=list
    )

    goal: str = ""

    # Existing information
    constraints: List[str] = Field(
        default_factory=list
    )

    learning_tier: Optional[str] = None


# =========================================================
# CREATE CHALLENGE
# =========================================================

class ChallengeCreate(ChallengeBase):
    pass


# =========================================================
# CHALLENGE RESPONSE
# =========================================================

class ChallengeResponse(ChallengeBase):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    created_at: Optional[datetime] = None

    created_by_id: Optional[str] = None


# =========================================================
# ENROLLMENT RESPONSE
# =========================================================

class EnrollmentResponse(BaseModel):

    model_config = ConfigDict(
        from_attributes=True
    )

    id: int

    user_id: str

    challenge_id: int

    status: str

    enrolled_at: datetime