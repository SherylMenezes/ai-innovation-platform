from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.submission import Submission
from app.schemas.submission import SubmissionStatusResponse
from app.routers.gamification import get_current_user_id

router = APIRouter(prefix="/api/submissions", tags=["Submissions"])


@router.get("/{submission_id}/status", response_model=SubmissionStatusResponse)
def get_submission_status(
    submission_id: int,
    user_id: int = Depends(get_current_user_id),
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