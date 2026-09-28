from typing import List, Optional
from pydantic import BaseModel, Field


# --- Request Schemas ---

class ProblemRefineRequest(BaseModel):
    problem_statement: str = Field(..., min_length=3, description="Initial problem statement to refine")

    # New sequential 5-Whys flow. previous_answers contains the student's
    # completed answers before the current Why step.
    previous_answers: List[str] = Field(
        default_factory=list,
        description="Completed Why answers before the current step, in order.",
    )
    current_step: int = Field(
        default=0,
        ge=0,
        le=4,
        description="Zero-based current Why step. 0 = Why 1 and 4 = Why 5.",
    )
    current_answer: str = Field(
        default="",
        description="The student's answer for the current Why step, if entered.",
    )
    help_me_answer: bool = Field(
        default=False,
        description="True only when the student explicitly asks AI to generate a possible answer.",
    )

    # Kept for compatibility with the previous frontend/backend contract.
    # New code should use previous_answers/current_step/current_answer.
    existing_whys: Optional[List[str]] = Field(
        default=None,
        description="Legacy field retained for backward compatibility.",
    )


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


class SwotScoreRequest(BaseModel):
    title: str
    description: str = ""
    strengths: str = ""
    weaknesses: str = ""
    opportunities: str = ""
    threats: str = ""


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
    # Legacy field retained so existing consumers do not break. In the new
    # flow the frontend uses next_question instead.
    five_whys: List[str] = Field(default_factory=list)

    # Sequential 5-Whys guidance.
    next_question: str = ""
    thinking_prompts: List[str] = Field(default_factory=list)
    generated_answer: str = ""
    answer_feedback: str = ""

    synthesized_root_cause: str = ""
    refined_problem_statement: str = ""
    hidden_variables: List[str] = Field(default_factory=list)
    stakeholders: List[str] = Field(default_factory=list)
    market_gaps: List[str] = Field(default_factory=list)
    trend_insights: List[str] = Field(default_factory=list)


class ProblemCanvasScoreRequest(BaseModel):
    problem_statement: str = Field(..., min_length=3, description="Original challenge problem statement")
    why_answers: List[str] = Field(..., min_length=1, max_length=5, description="Completed 5-Whys answers in order")
    root_cause: str = ""
    refined_problem_statement: str = ""


class CanvasMetric(BaseModel):
    score: int = Field(..., ge=0, le=100)
    explanation: str = ""


class ProblemCanvasScoreResponse(BaseModel):
    problem_clarity: CanvasMetric
    impact: CanvasMetric
    feasibility: CanvasMetric
    overall_score: int = Field(..., ge=0, le=100)
    improvement_suggestions: List[str] = Field(default_factory=list)


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


class CriterionScore(BaseModel):
    # Same 1-5 scale the evaluation page displays, so the frontend can use
    # it as-is instead of normalizing from 0-100.
    score: int = Field(..., ge=1, le=5)
    reason: str


class SwotScoreResponse(BaseModel):
    feasibility: CriterionScore
    impact: CriterionScore
    innovation: CriterionScore
    scalability: CriterionScore
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