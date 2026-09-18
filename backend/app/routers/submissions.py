from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import Submission, Scorecard
from app.schemas.submission import SubmissionStatusResponse, ScorecardResponse
from app.routers.gamification import get_current_user

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])


@router.get("/{submission_id}/status", response_model=SubmissionStatusResponse)
def get_submission_status(
    submission_id: int,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sub = db.query(Submission).filter(Submission.id == submission_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    if sub.user_id != user_id:
        raise HTTPException(
            status_code=403, detail="Not authorized to view this submission"
        )
    return sub

@router.get("/{submission_id}/scorecard", response_model=ScorecardResponse)
def get_submission_scorecard(
    submission_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    user_id = getattr(current_user, "id", None) or (current_user.get("user_id") if isinstance(current_user, dict) else current_user)
    if str(submission.user_id) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden from viewing another user's scorecard")

    scorecard = db.query(Scorecard).filter(Scorecard.submission_id == submission_id).first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")

    return scorecard