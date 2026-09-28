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
    user_id: str
    status: str
    file_url: str
    created_at: Optional[datetime] = None
    scorecard: Optional[ScorecardResponse] = None
    # Only set on the create response: XP paid for this submission.
    xp_awarded: int = 0
    # Set when the latest evaluation job failed (e.g. Gemini overloaded),
    # so the page can stop polling for a scorecard that won't arrive.
    evaluation_error: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EvaluateSubmissionResponse(BaseModel):
    job_id: str
    submission_id: int
    status: str