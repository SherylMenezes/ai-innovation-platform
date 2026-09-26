from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict

from app.schemas.gamification import BadgeItem


class ChallengeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    domain: str
    difficulty: str
    description: str
    learning_tier: Optional[str] = None


class ScorecardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    innovation_score: float
    feasibility_score: float
    impact_score: float
    overall_score: float
    feedback: Optional[str] = None


class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    file_url: str
    repository_url: Optional[str] = None
    scorecard: Optional[ScorecardOut] = None


class LevelProgress(BaseModel):
    number: int
    stage: str
    name: str
    status: str  # completed | current | locked
    xp_earned: int
    xp_available: int


class ChallengeProgress(BaseModel):
    current_level: int
    current_level_name: str
    total_levels: int
    levels_completed: int
    is_completed: bool
    xp_earned: int
    xp_available: int
    levels: list[LevelProgress]


class XpRewardItem(BaseModel):
    points: int
    source_event: str
    metadata: dict[str, Any] = {}
    created_at: Optional[datetime] = None


class WorkspaceState(BaseModel):
    challenge: ChallengeSummary
    status: str
    current_stage: str
    canvas_state: dict[str, Any] = {}
    evaluation_state: dict[str, Any] = {}
    completed_steps: list[str] = []
    submission: Optional[SubmissionOut] = None
    progress: ChallengeProgress
    # This challenge's XP history, oldest first.
    rewards: list[XpRewardItem] = []
    badges_earned: list[BadgeItem] = []


class CanvasStateUpdate(BaseModel):
    canvas_state: dict[str, Any]
    # Step key to credit with XP the first time it's saved — omit to save
    # progress without triggering a reward (e.g. autosave on every keystroke).
    mark_step_complete: Optional[str] = None


class EvaluationStateUpdate(BaseModel):
    evaluation_state: dict[str, Any]
    mark_step_complete: Optional[str] = None


class WorkspaceSaveResponse(BaseModel):
    current_stage: str
    completed_steps: list[str]
    xp_awarded: int = 0
    total_xp: Optional[int] = None


class AdvanceStageRequest(BaseModel):
    # The stage the calling page is finishing. If the student is already
    # past it (revisiting an earlier Level), the advance is a no-op.
    stage: Optional[str] = None


class AdvanceStageResponse(BaseModel):
    current_stage: str
    xp_awarded: int = 0
    total_xp: Optional[int] = None
    # Set when this call cleared a Level, e.g. {"number": 1, "name": "Problem Canvas"}.
    cleared_level: Optional[dict[str, Any]] = None


class StepCompleteRequest(BaseModel):
    step_key: str


class EnrolledChallengeItem(BaseModel):
    challenge: ChallengeSummary
    status: str
    current_stage: str
    progress: ChallengeProgress


class EnrolledChallengesResponse(BaseModel):
    items: list[EnrolledChallengeItem]
