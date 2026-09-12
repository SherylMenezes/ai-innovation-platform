from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class EvaluationJobRequest(BaseModel):
    title: str = Field(..., min_length=3, description="Idea or project title")
    description: str = Field(..., min_length=10, description="Idea context and mechanism")


class EvaluationJobResponse(BaseModel):
    job_id: str
    status: str
    created_at: datetime


class EvaluationJobStatusResponse(BaseModel):
    job_id: str
    status: str
    title: str
    result: Optional[dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
