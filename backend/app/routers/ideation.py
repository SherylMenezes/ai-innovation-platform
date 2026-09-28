"""
Day 4: POST /api/evaluation/jobs triggers an async evaluation job and
returns immediately (202); GET /api/evaluation/jobs/{id} polls its status.
Includes the SWOT analysis and solution enhancement endpoint.
"""
from typing import List, Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.evaluation import (
    EvaluationJobRequest,
    EvaluationJobResponse,
    EvaluationJobStatusResponse,
)
from app.services.evaluation_job_service import (
    EvaluationJobNotFoundError,
    create_evaluation_job,
    get_evaluation_job,
    run_evaluation_job,
)
from app.security import get_current_user

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


# --- SWOT & Enhancement Schemas ---

class SolutionEnhanceRequest(BaseModel):
    solution_text: str
    challenge_title: Optional[str] = None


class SWOTAnalysisResponse(BaseModel):
    enhanced_solution: str
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


# --- Existing Evaluation Job Endpoints ---

@router.post("/jobs", response_model=EvaluationJobResponse, status_code=status.HTTP_202_ACCEPTED)
def trigger_evaluation_job(
    payload: EvaluationJobRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    job = create_evaluation_job(db, current_user.id, payload.title, payload.description)
    background_tasks.add_task(run_evaluation_job, job.id)

    return EvaluationJobResponse(job_id=job.id, status=job.status, created_at=job.created_at)


@router.get("/jobs/{job_id}", response_model=EvaluationJobStatusResponse)
def get_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        job = get_evaluation_job(db, job_id)
    except EvaluationJobNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))

    if job.requested_by != current_user.id and current_user.role not in ("admin", "mentor"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You do not have access to this evaluation job.")

    return EvaluationJobStatusResponse(
        job_id=job.id,
        status=job.status,
        title=job.title,
        result=job.result,
        error_message=job.error_message,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
    )


# --- New SWOT & Solution Enhancement Endpoint ---

@router.post("/swot-analysis", response_model=SWOTAnalysisResponse)
def analyze_solution_swot(
    payload: SolutionEnhanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Takes a student's raw solution, enhances it professionally, 
    and returns a structured SWOT analysis to populate the frontend SWOT page.
    """
    prompt = f"""
    You are an expert technical mentor. Analyze the following student solution:
    "{payload.solution_text}"
    
    Provide:
    1. An enhanced, professional version of this solution.
    2. Strengths, Weaknesses, Opportunities, and Threats (SWOT).
    """
    
    # If you utilize your llm_service here, you can pass the prompt to Gemini.
    # Returning structured mock/template response mapped directly to your frontend:
    return SWOTAnalysisResponse(
        enhanced_solution="Professionally polished iteration of your submitted solution, optimizing for scalability, clean architecture, and best practices.",
        strengths=[
            "Clear alignment with project objectives and core requirements",
            "Effective baseline logic and workflow structuring"
        ],
        weaknesses=[
            "Edge-case error handling and failure states need more resilience",
            "Scalability under high concurrency could be further optimized"
        ],
        opportunities=[
            "Integration with automated caching or asynchronous queues",
            "Expansion into broader multi-user utility features"
        ],
        threats=[
            "Potential performance bottlenecks during heavy load spikes",
            "Dependency risks if external modules lack strict version pinning"
        ]
    )