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

from app.database import get_db
from app.models.user import User
from app.models.gamification import UserGamificationProfile
from app.schemas.gamification import AwardXpRequest, AwardXpResponse, StreakCheckInResponse, UserStatsResponse
from app.services.gamification_service import UserNotFoundError, award_xp, record_streak_checkin
from app.security import require_role, get_current_user

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


@router.post("/streak/check-in", response_model=StreakCheckInResponse)
async def streak_check_in(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await record_streak_checkin(db, current_user.id)

    xp_awarded = 0
    message = "Already checked in today."
    if result.extended:
        award = await award_xp(db, current_user.id, 10, "STREAK_CHECKIN")
        xp_awarded = award.points_awarded
        message = "Check-in successful!"

    return StreakCheckInResponse(
        current_streak=result.current_streak,
        longest_streak=result.longest_streak,
        xp_awarded=xp_awarded,
        message=message,
    )

@router.get("/user-stats", response_model=UserStatsResponse)
def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.get(UserGamificationProfile, current_user.id)
    if profile is None:
        return UserStatsResponse(
            user_id=current_user.id,
            xp=0,
            current_streak=0,
            longest_streak=0,
            last_check_in=None,
        )
    return UserStatsResponse(
        user_id=profile.user_id,
        xp=profile.total_xp,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        last_check_in=profile.last_checkin_date,
    )