from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class ScorecardResponse(BaseModel):
    id: int
    submission_id: int
    innovation_score: float
    feasibility_score: float
    impact_score: float
    overall_score: float
    feedback: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SubmissionStatusResponse(BaseModel):
    id: int
    challenge_id: int
    user_id: int
    status: str
    file_url: str
    created_at: Optional[datetime] = None
    scorecard: Optional[ScorecardResponse] = None

    model_config = ConfigDict(from_attributes=True)