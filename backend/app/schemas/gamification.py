from typing import Any, Optional

from pydantic import BaseModel, Field, ConfigDict

from datetime import date

class AwardXpRequest(BaseModel):
    user_id: str = Field(..., min_length=1, description="Target user's id")
    points: int = Field(..., gt=0, description="XP points to award; must be a positive integer")
    source_event: str = Field(
        ..., min_length=1, max_length=64, description="What triggered this award, e.g. TASK_COMPLETED"
    )
    metadata: dict[str, Any] | None = Field(
        default=None, description="Arbitrary context about the award (task id, challenge id, etc.)"
    )


class AwardXpResponse(BaseModel):
    user_id: str
    points_awarded: int
    total_xp: int
    current_streak: int
    longest_streak: int
    source_event: str
    transaction_id: str


class StreakCheckInResponse(BaseModel):
    current_streak: int
    longest_streak: int
    xp_awarded: int
    message: str

    model_config = ConfigDict(from_attributes=True)


class UserStatsResponse(BaseModel):
    user_id: str
    xp: int
    current_streak: int
    longest_streak: int
    last_check_in: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)