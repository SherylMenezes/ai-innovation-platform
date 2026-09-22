from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class MentorMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    stage: Optional[str] = None
    created_at: datetime


class MentorHistoryResponse(BaseModel):
    workspace_id: str
    messages: List[MentorMessageResponse]
