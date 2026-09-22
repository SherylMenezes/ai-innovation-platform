from typing import List, Optional
from pydantic import BaseModel, Field


# --- Request Schemas ---

class ProblemRefineRequest(BaseModel):
    problem_statement: str = Field(..., min_length=3, description="Initial problem statement to refine")


class HMWGenerateRequest(BaseModel):
    root_cause: str = Field(..., min_length=3, description="Root cause identified from 5-Whys analysis")


class ProblemScoreRequest(BaseModel):
    problem_statement: str = Field(..., min_length=3, description="Problem statement to evaluate")


class ScamperPromptRequest(BaseModel):
    hmw_statement: str = Field(..., min_length=3, description="How Might We statement")


class MindMapRequest(BaseModel):
    concept: str = Field(..., min_length=3, description="Core concept or topic for mindmap")


class IdeaItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = Field(default="", description="Detailed explanation of the idea concept")


class IdeaEvaluationRequest(BaseModel):
    ideas: List[IdeaItem]


class GenerateIdeasRequest(BaseModel):
    problem_or_hmw: str = Field(
        ..., 
        alias="context", 
        description="Problem or HMW context (accepts 'context' or 'problem_or_hmw')"
    )
    count: Optional[int] = Field(default=5, ge=1, le=10)

    class Config:
        populate_by_name = True


class RemixIdeasRequest(BaseModel):
    idea_descriptions: List[str] = Field(
        ..., 
        alias="descriptions", 
        description="List of idea strings to remix (accepts 'descriptions' or 'idea_descriptions')"
    )

    class Config:
        populate_by_name = True


class IdeaScoreRequest(BaseModel):
    title: str
    description: str = ""


class SWOTAnalysisRequest(BaseModel):
    title: str
    description: str = ""


class MentorCoachRequest(BaseModel):
    workspace_context: str
    user_query: str
    current_stage: str
    workspace_id: str = "default"


class MentorStreamRequest(BaseModel):
    workspace_context: str
    user_query: str
    current_stage: str
    workspace_id: str = "default"


# --- Response Schemas ---

class ProblemRefineResponse(BaseModel):
    five_whys: List[str]
    synthesized_root_cause: str


class HMWItem(BaseModel):
    id: str
    category: str
    hmw_statement: str


class HMWGenerateResponse(BaseModel):
    hmw_statements: List[HMWItem]


class MetricScore(BaseModel):
    score: int
    reason: str


class ProblemScoreResponse(BaseModel):
    clarity: MetricScore
    specificity: MetricScore
    actionability: MetricScore
    overall_score: int
    suggestions: List[str]


class ScamperCategory(BaseModel):
    technique: str
    prompt: str
    idea_seed: str


class ScamperPromptResponse(BaseModel):
    scamper_prompts: List[ScamperCategory]


class MindMapNode(BaseModel):
    id: str
    label: str
    parent_id: Optional[str] = None
    category: Optional[str] = None


class MindMapResponse(BaseModel):
    root_concept: str
    nodes: List[MindMapNode]


class EvaluatedIdea(BaseModel):
    id: str
    title: str
    feasibility_score: int
    impact_score: int
    quadrant: str
    rationale: str


class IdeaEvaluationResponse(BaseModel):
    evaluated_ideas: List[EvaluatedIdea]


class DivergentIdea(BaseModel):
    id: str
    title: str
    description: str
    category: str


class GenerateIdeasResponse(BaseModel):
    ideas: List[DivergentIdea]


class RemixIdeasResponse(BaseModel):
    remixed_title: str
    remixed_concept: str
    combined_elements: List[str]


class IdeaScoreResponse(BaseModel):
    # Explicit 0-100 bounds so every consumer (submission scorecards,
    # the evaluation-page /5 normalizer) can rely on one fixed scale
    # instead of whatever range the model happens to pick on its own.
    feasibility_score: int = Field(..., ge=0, le=100)
    impact_score: int = Field(..., ge=0, le=100)
    complexity_score: int = Field(..., ge=0, le=100)
    summary: str


class RiskCategory(BaseModel):
    risk_type: str
    description: str
    impact_level: str
    mitigation: str


class RiskAnalysisResponse(BaseModel):
    title: str
    risks: List[RiskCategory]


class SWOTAnalysisResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]
    strategic_recommendation: str


class MentorCoachResponse(BaseModel):
    feedback: str
    socratic_questions: List[str]
    recommended_next_step: str