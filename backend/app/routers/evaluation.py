"""
Day 4: POST /api/evaluation/jobs triggers an async evaluation job and
returns immediately (202); GET /api/evaluation/jobs/{id} polls its status.
Open to any authenticated user (self-service, unlike award-xp) — a job's
status/result is visible to the user who requested it, or admin/mentor.
"""
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
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
from security import get_current_user

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


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
