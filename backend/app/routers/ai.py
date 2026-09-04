from fastapi import APIRouter, HTTPException, status
from app.schemas.ai import (
    ProblemRefineRequest,
    ProblemRefineResponse,
    HmwGenerateRequest,
    HmwGenerateResponse
)
from app.services.llm_service import (
    generate_5whys_analysis,
    generate_hmw_statements
)

router = APIRouter(
    prefix="/api/ai",
    tags=["AI Ideation Engine"]
)

@router.post(
    "/problem-refine",
    response_model=ProblemRefineResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 5-Whys root cause analysis"
)
async def refine_problem(payload: ProblemRefineRequest):
    try:
        return generate_5whys_analysis(payload.problem_statement)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refine problem statement: {str(exc)}"
        )

@router.post(
    "/hmw-generate",
    response_model=HmwGenerateResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate How-Might-We statements from root cause"
)
async def create_hmw_statements(payload: HmwGenerateRequest):
    try:
        return generate_hmw_statements(payload.problem_statement, payload.root_cause)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate HMW statements: {str(exc)}"
        )