from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.mentor import MentorHistoryResponse
from app.security import get_current_user
from app.services import mentor_service, workspace_service
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
    IdeaScoreRequest,
    IdeaScoreResponse,
    RiskAnalysisResponse,
    SWOTAnalysisRequest,
    SWOTAnalysisResponse,
    MentorCoachRequest,
    MentorCoachResponse,
    MentorStreamRequest,
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
    calculate_idea_score,
    analyze_idea_risks,
    generate_swot_analysis,
    run_mentor_coach,
    stream_socratic_mentor,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

# --- Week 1 & 2 Endpoints ---

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
async def get_mindmap(payload: MindMapRequest):
    return await generate_mind_map_nodes(payload.concept)

@router.post("/evaluate-ideas", response_model=IdeaEvaluationResponse)
async def evaluate_ideas(payload: IdeaEvaluationRequest):
    return await evaluate_ideation_list(payload.ideas)

@router.post("/generate-ideas", response_model=GenerateIdeasResponse)
async def get_divergent_ideas(payload: GenerateIdeasRequest):
    return await generate_divergent_ideas(
        context=payload.problem_or_hmw, 
        count=payload.count or 5
    )

@router.post("/remix-ideas", response_model=RemixIdeasResponse)
async def get_remixed_ideas(payload: RemixIdeasRequest):
    return await remix_ideas(payload.idea_descriptions)

# --- Week 3 Endpoints ---

@router.post("/score-idea", response_model=IdeaScoreResponse)
async def score_single_idea(payload: IdeaScoreRequest):
    return await calculate_idea_score(payload.title, payload.description)

@router.get("/risk-analysis", response_model=RiskAnalysisResponse)
async def get_risk_analysis(
    title: str = Query(..., min_length=3, description="Idea or project title"),
    description: str = Query(default="", description="Optional context description")
):
    return await analyze_idea_risks(title, description)

@router.post("/swot-analysis", response_model=SWOTAnalysisResponse)
async def get_swot_analysis(payload: SWOTAnalysisRequest):
    return await generate_swot_analysis(payload.title, payload.description)

@router.post("/mentor-coach", response_model=MentorCoachResponse)
async def chat_with_mentor_coach(
    payload: MentorCoachRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mentor_service.record_message(db, current_user.id, payload.workspace_id, "user", payload.user_query, payload.current_stage)
    result = await run_mentor_coach(payload.workspace_context, payload.user_query, payload.current_stage)
    mentor_service.record_message(db, current_user.id, payload.workspace_id, "assistant", result.feedback, payload.current_stage)
    return result

# --- Week 4 Day 1 Endpoint ---

@router.post("/mentor/stream")
async def stream_mentor_chat(
    payload: MentorStreamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Week 4 Day 3:
    Stream a context-aware Socratic mentor response.

    When workspace_id contains a numeric challenge ID, the backend
    loads the user's real workspace state from PostgreSQL and uses
    that state as the AI context.

    If workspace_id is not numeric, the existing workspace_context
    supplied by the caller is used as a fallback.
    """

    workspace_context = payload.workspace_context
    current_stage = payload.current_stage

    # Try to connect the mentor to the actual PostgreSQL workspace.
    # Existing callers using "default" continue to work.
    try:
        challenge_id = int(payload.workspace_id)

        _, workspace_context = workspace_service.get_ai_workspace_context(
            db=db,
            user_id=current_user.id,
            challenge_id=challenge_id,
        )

        # Use the real stage stored in the workspace.
        workspace_data = workspace_service.get_workspace_data(
            db,
            current_user.id,
            challenge_id,
        )

        current_stage = workspace_data["current_stage"]

    except ValueError:
        # workspace_id is not a numeric challenge ID.
        # Keep the existing context/stage supplied by the caller.
        pass

    except workspace_service.WorkspaceNotFoundError:
        # Preserve existing mentor behavior if the workspace cannot
        # be found for this user.
        pass

    mentor_service.record_message(
        db,
        current_user.id,
        payload.workspace_id,
        "user",
        payload.user_query,
        current_stage,
    )

    async def _stream_and_record():
        chunks: list[str] = []

        async for chunk in stream_socratic_mentor(
            workspace_context,
            payload.user_query,
            current_stage,
        ):
            chunks.append(chunk)
            yield chunk

        mentor_service.record_message(
            db,
            current_user.id,
            payload.workspace_id,
            "assistant",
            "".join(chunks),
            current_stage,
        )

    return StreamingResponse(
        _stream_and_record(),
        media_type="text/plain",
    )


@router.get("/mentor/history", response_model=MentorHistoryResponse)
def get_mentor_history(
    workspace_id: str = Query("default", description="Mentor thread to fetch history for"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages = mentor_service.get_history(db, current_user.id, workspace_id)
    return MentorHistoryResponse(workspace_id=workspace_id, messages=messages)