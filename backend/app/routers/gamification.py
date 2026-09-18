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
from app.models.gamification import UserGamificationProfile, Badge, UserBadge
from app.schemas.gamification import AwardXpRequest, AwardXpResponse, StreakCheckInResponse, UserStatsResponse, BadgeItem, UserBadgesResponse, AwardBadgeRequest, AwardBadgeResponse
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

@router.get("/badges", response_model=UserBadgesResponse)
def get_user_badges(
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    all_badges = db.query(Badge).all()
    user_awards = {
        ub.badge_id: ub.awarded_at
        for ub in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
    }

    result = []
    for b in all_badges:
        is_unlocked = b.id in user_awards
        result.append(
            BadgeItem(
                id=b.id,
                slug=b.slug,
                name=b.name,
                description=b.description,
                icon_url=b.icon_url,
                unlocked=is_unlocked,
                awarded_at=user_awards.get(b.id),
            )
        )

    return UserBadgesResponse(
        total_unlocked=len(user_awards),
        badges=result,
    )

@router.post("/badges/award", response_model=AwardBadgeResponse)
def award_badge(
    payload: AwardBadgeRequest,
    db: Session = Depends(get_db),
):
    badge = db.query(Badge).filter(Badge.slug == payload.badge_slug).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")

    existing = (
        db.query(UserBadge)
        .filter(UserBadge.user_id == payload.user_id, UserBadge.badge_id == badge.id)
        .first()
    )
    if existing:
        return AwardBadgeResponse(
            success=False,
            message="Badge already awarded to this user.",
            badge=BadgeItem(
                id=badge.id,
                slug=badge.slug,
                name=badge.name,
                description=badge.description,
                icon_url=badge.icon_url,
                unlocked=True,
                awarded_at=existing.awarded_at,
            ),
        )

    new_award = UserBadge(user_id=payload.user_id, badge_id=badge.id)
    db.add(new_award)
    db.commit()
    db.refresh(new_award)

    return AwardBadgeResponse(
        success=True,
        message="Badge awarded successfully.",
        badge=BadgeItem(
            id=badge.id,
            slug=badge.slug,
            name=badge.name,
            description=badge.description,
            icon_url=badge.icon_url,
            unlocked=True,
            awarded_at=new_award.awarded_at,
        ),
    )