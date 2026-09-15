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
from app.schemas.gamification import AwardXpRequest, AwardXpResponse, StreakCheckInResponse, UserStatsResponse
from app.services.gamification_service import UserNotFoundError, award_xp
from app.security import require_role, decode_token

from datetime import datetime, timezone, timedelta
from app.models.gamification import UserGamification, XPHistory
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/api/gamification", tags=["gamification"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

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


def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    return payload.get("user_id", 1)


@router.post("/streak/check-in", response_model=StreakCheckInResponse)
def streak_check_in(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    record = (
        db.query(UserGamification).filter(UserGamification.user_id == user_id).first()
    )
    if not record:
        record = UserGamification(user_id=user_id, xp=0, current_streak=0, longest_streak=0)
        db.add(record)
        db.commit()
        db.refresh(record)

    now = datetime.now(timezone.utc)
    xp_to_award = 10

    if record.last_check_in:
        last_date = record.last_check_in.date()
        today = now.date()

        if last_date == today:
            return StreakCheckInResponse(
                current_streak=record.current_streak,
                longest_streak=record.longest_streak,
                xp_awarded=0,
                message="Already checked in today.",
            )
        elif last_date == today - timedelta(days=1):
            record.current_streak += 1
        else:
            record.current_streak = 1
    else:
        record.current_streak = 1

    if record.current_streak > record.longest_streak:
        record.longest_streak = record.current_streak

    record.xp += xp_to_award
    record.last_check_in = now

    history = XPHistory(user_id=user_id, amount=xp_to_award, reason="daily_check_in")
    db.add(history)
    db.commit()
    db.refresh(record)

    return StreakCheckInResponse(
        current_streak=record.current_streak,
        longest_streak=record.longest_streak,
        xp_awarded=xp_to_award,
        message="Check-in successful!",
    )

@router.get("/user-stats", response_model=UserStatsResponse)
def get_user_stats(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    record = (
        db.query(UserGamification).filter(UserGamification.user_id == user_id).first()
    )
    if not record:
        return UserStatsResponse(
            user_id=user_id,
            xp=0,
            current_streak=0,
            longest_streak=0,
            last_check_in=None,
        )
    return record