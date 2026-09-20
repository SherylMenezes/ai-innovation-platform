from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.challenge import Challenge
from app.models.submission import Submission, Scorecard
from app.models.user import User
from app.schemas.submission import EvaluateSubmissionResponse, SubmissionStatusResponse, ScorecardResponse
from app.services.evaluation_job_service import create_evaluation_job, run_evaluation_job
from app.security import get_current_user

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])


def _get_owned_submission(db: Session, submission_id: int, current_user: User) -> Submission:
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.user_id != current_user.id and current_user.role not in ("admin", "mentor"):
        raise HTTPException(status_code=403, detail="Not authorized to view this submission")
    return sub


@router.get("/{submission_id}/status", response_model=SubmissionStatusResponse)
def get_submission_status(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_submission(db, submission_id, current_user)


@router.post("/{submission_id}/evaluate", response_model=EvaluateSubmissionResponse, status_code=status.HTTP_202_ACCEPTED)
def evaluate_submission(
    submission_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Epic 4.2: triggers the same async evaluation engine used by
    /api/evaluation/jobs, but scoped to a submission — the job's result
    writes into this submission's Scorecard (see
    evaluation_job_service._write_scorecard) instead of only living on
    the job record, so GET /{id}/scorecard has something to return."""
    submission = _get_owned_submission(db, submission_id, current_user)

    challenge = db.get(Challenge, submission.challenge_id)
    title = challenge.title if challenge else f"Submission {submission.id}"
    description = challenge.description if challenge else (submission.repository_url or submission.file_url)

    job = create_evaluation_job(db, current_user.id, title, description, submission_id=submission.id)
    background_tasks.add_task(run_evaluation_job, job.id)

    return EvaluateSubmissionResponse(job_id=job.id, submission_id=submission.id, status=job.status)


@router.get("/{submission_id}/scorecard", response_model=ScorecardResponse)
def get_submission_scorecard(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_submission(db, submission_id, current_user)

    scorecard = db.query(Scorecard).filter(Scorecard.submission_id == submission_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    return scorecard