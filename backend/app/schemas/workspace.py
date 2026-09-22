from typing import Any, Optional

from pydantic import BaseModel, ConfigDict


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


class WorkspaceState(BaseModel):
    challenge: ChallengeSummary
    status: str
    current_stage: str
    canvas_state: dict[str, Any] = {}
    evaluation_state: dict[str, Any] = {}
    completed_steps: list[str] = []
    submission: Optional[SubmissionOut] = None


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


class AdvanceStageResponse(BaseModel):
    current_stage: str


class StepCompleteRequest(BaseModel):
    step_key: str


class EnrolledChallengeItem(BaseModel):
    challenge: ChallengeSummary
    status: str
    current_stage: str


class EnrolledChallengesResponse(BaseModel):
    items: list[EnrolledChallengeItem]
