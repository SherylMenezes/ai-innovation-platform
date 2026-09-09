from pydantic import BaseModel, Field
from typing import List, Optional

# --- Week 1: Problem Refine & HMW Schemas ---

class ProblemRefineRequest(BaseModel):
    problem_statement: str = Field(..., min_length=5, description="Initial problem statement")

class ProblemRefineResponse(BaseModel):
    synthesized_root_cause: str
    five_whys: List[str]

class HMWGenerateRequest(BaseModel):
    root_cause: str = Field(..., min_length=5, description="Synthesized root cause or problem")

class HMWCard(BaseModel):
    id: str
    category: str
    statement: str

class HMWGenerateResponse(BaseModel):
    cards: List[HMWCard]

# --- Week 2: Scoring, SCAMPER, Generation & Remixing Schemas ---

class ProblemScoreRequest(BaseModel):
    problem_statement: str = Field(..., min_length=5, description="The user problem statement to score")

class ScoringDimension(BaseModel):
    name: str
    score: int
    feedback: str

class ProblemScoreResponse(BaseModel):
    overall_score: int
    grade: str
    dimensions: List[ScoringDimension]
    strengths: List[str]
    improvements: List[str]

class ScamperSuggestion(BaseModel):
    technique: str  # Substitute, Combine, Adapt, Modify, Put to another use, Eliminate, Reverse
    prompt_question: str
    idea_seed: str

class ScamperPromptRequest(BaseModel):
    hmw_statement: str = Field(..., min_length=5, description="The selected How Might We statement")

class ScamperPromptResponse(BaseModel):
    hmw_statement: str
    suggestions: List[ScamperSuggestion]

class MindMapNode(BaseModel):
    id: str
    label: str
    parent_id: Optional[str] = None
    category: str

class MindMapResponse(BaseModel):
    root_concept: str
    nodes: List[MindMapNode]

class MindMapRequest(BaseModel):
    concept: str = Field(..., min_length=3, description="Core problem or HMW statement")

class IdeaItem(BaseModel):
    id: str
    title: str
    description: str

class EvaluatedIdea(BaseModel):
    id: str
    title: str
    feasibility_score: int
    impact_score: int
    quadrant: str
    rationale: str

class IdeaEvaluationRequest(BaseModel):
    ideas: List[IdeaItem]

class IdeaEvaluationResponse(BaseModel):
    evaluated_ideas: List[EvaluatedIdea]

class GenerateIdeasRequest(BaseModel):
    problem_or_hmw: str = Field(..., min_length=5, description="Problem or HMW context")
    count: int = Field(default=5, ge=1, le=10)

class GeneratedIdea(BaseModel):
    id: str
    title: str
    description: str
    category: str

class GenerateIdeasResponse(BaseModel):
    ideas: List[GeneratedIdea]

class RemixIdeasRequest(BaseModel):
    idea_ids: List[str] = Field(default_factory=list)
    idea_descriptions: List[str] = Field(..., min_length=2, description="At least two ideas to remix")

class RemixIdeasResponse(BaseModel):
    remixed_title: str
    remixed_concept: str
    combined_elements: List[str]