from fastapi import APIRouter
from app.schemas.ai import (
    ProblemRefineRequest,
    ProblemRefineResponse,
    HMWGenerateRequest,
    HMWGenerateResponse,
    ProblemScoreRequest,
    ProblemScoreResponse,
    ScamperPromptRequest,
    ScamperPromptResponse,
    MindMapRequest,
    MindMapResponse,
    IdeaEvaluationRequest,
    IdeaEvaluationResponse,
    GenerateIdeasRequest,
    GenerateIdeasResponse,
    RemixIdeasRequest,
    RemixIdeasResponse,
)
from app.services.llm_service import (
    refine_problem_statement,
    generate_hmw_statements,
    score_problem_statement,
    generate_scamper_prompts,
    generate_mind_map_nodes,
    evaluate_ideation_list,
    generate_divergent_ideas,
    remix_ideas,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

@router.post("/problem-refine", response_model=ProblemRefineResponse)
async def refine_problem(payload: ProblemRefineRequest):
    return await refine_problem_statement(payload.problem_statement)

@router.post("/hmw-generate", response_model=HMWGenerateResponse)
async def generate_hmw(payload: HMWGenerateRequest):
    return await generate_hmw_statements(payload.root_cause)

@router.post("/problem-score", response_model=ProblemScoreResponse)
async def score_problem(payload: ProblemScoreRequest):
    return await score_problem_statement(payload.problem_statement)

@router.post("/scamper-prompts", response_model=ScamperPromptResponse)
async def get_scamper_prompts(payload: ScamperPromptRequest):
    return await generate_scamper_prompts(payload.hmw_statement)

@router.post("/mindmap-generate", response_model=MindMapResponse)
async def get_mindmap_nodes(payload: MindMapRequest):
    return await generate_mind_map_nodes(payload.concept)

@router.post("/evaluate-ideas", response_model=IdeaEvaluationResponse)
async def evaluate_ideas(payload: IdeaEvaluationRequest):
    return await evaluate_ideation_list(payload.ideas)

@router.post("/generate-ideas", response_model=GenerateIdeasResponse)
async def get_divergent_ideas(payload: GenerateIdeasRequest):
    return await generate_divergent_ideas(payload.problem_or_hmw, payload.count)

@router.post("/remix-ideas", response_model=RemixIdeasResponse)
async def get_remixed_ideas(payload: RemixIdeasRequest):
    return await remix_ideas(payload.idea_descriptions)