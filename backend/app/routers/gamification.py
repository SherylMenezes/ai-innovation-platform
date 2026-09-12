"""
Day 2: POST /api/gamification/award-xp.

Restricted to admin/mentor — this endpoint trusts a client-supplied
user_id and points value, so letting any authenticated student call it
directly would let them award themselves unlimited XP. The path students
actually earn XP through is the Day 3 event broker (task completions,
challenge submissions, etc.), not a direct call to this endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.gamification import AwardXpRequest, AwardXpResponse
from app.services.gamification_service import UserNotFoundError, award_xp
from security import require_role

router = APIRouter(prefix="/api/gamification", tags=["gamification"])


@router.post("/award-xp", response_model=AwardXpResponse)
async def award_xp_endpoint(
    payload: AwardXpRequest,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_role("admin", "mentor")),
):
    try:
        result = await award_xp(
            db,
            user_id=payload.user_id,
            points=payload.points,
            source_event=payload.source_event,
            metadata=payload.metadata,
        )
    except UserNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc))
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))

    return AwardXpResponse(
        user_id=result.user_id,
        points_awarded=result.points_awarded,
        total_xp=result.total_xp,
        current_streak=result.current_streak,
        longest_streak=result.longest_streak,
        source_event=result.source_event,
        transaction_id=result.transaction_id,
    )
