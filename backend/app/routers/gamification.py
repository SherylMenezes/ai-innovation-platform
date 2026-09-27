"""
Day 2: POST /api/gamification/award-xp.

Restricted to admin/mentor — this endpoint trusts a client-supplied
user_id and points value, so letting any authenticated student call it
directly would let them award themselves unlimited XP. The path students
actually earn XP through is the Day 3 event broker (task completions,
challenge submissions, etc.), not a direct call to this endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.gamification import UserGamificationProfile, Badge, UserBadge, XPTransaction
from app.schemas.gamification import AwardXpRequest, AwardXpResponse, StreakCheckInResponse, UserStatsResponse, BadgeItem, UserBadgesResponse, AwardBadgeRequest, AwardBadgeResponse, XpHistoryItem, XpHistoryResponse
from app.schemas.leaderboard import LeaderboardResponse, LeaderboardScope
from app.services.badge_service import list_badges_for_user
from app.services.gamification_service import UserNotFoundError, award_xp, record_streak_checkin
from app.services.leaderboard_service import InvalidScopeError, get_leaderboard
from app.services.player_rank import rank_for_xp
from app.services.xp_rules import STREAK_CHECKIN_XP
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
        award = await award_xp(db, current_user.id, STREAK_CHECKIN_XP, "STREAK_CHECKIN")
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
            rank=rank_for_xp(0).as_dict(),
        )
    return UserStatsResponse(
        user_id=profile.user_id,
        xp=profile.total_xp,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        last_check_in=profile.last_checkin_date,
        rank=rank_for_xp(profile.total_xp).as_dict(),
    )


@router.get("/xp-history", response_model=XpHistoryResponse)
def get_xp_history(
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(XPTransaction)
        .filter(XPTransaction.user_id == current_user.id)
        .order_by(XPTransaction.created_at.desc())
        .limit(limit)
        .all()
    )
    return XpHistoryResponse(
        items=[
            XpHistoryItem(
                id=row.id,
                points=row.points,
                source_event=row.source_event,
                metadata=row.event_metadata or {},
                created_at=row.created_at,
            )
            for row in rows
        ]
    )

@router.get("/leaderboard", response_model=LeaderboardResponse)
def leaderboard(
    scope: LeaderboardScope = Query("global", description="global | institution | class"),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return get_leaderboard(db, scope, current_user, limit=limit)
    except InvalidScopeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))


@router.get("/badges", response_model=UserBadgesResponse)
def get_user_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = [
        BadgeItem(
            id=b.id,
            slug=b.slug,
            name=b.name,
            description=b.description,
            icon_url=b.icon_url,
            unlocked=awarded_at is not None,
            awarded_at=awarded_at,
        )
        for b, awarded_at in list_badges_for_user(db, current_user.id)
    ]

    return UserBadgesResponse(
        total_unlocked=sum(1 for b in result if b.unlocked),
        badges=result,
    )

@router.post("/badges/award", response_model=AwardBadgeResponse)
def award_badge(
    payload: AwardBadgeRequest,
    db: Session = Depends(get_db),
    # Same reasoning as award_xp above: this trusts a client-supplied
    # user_id, so it must not be callable by an unauthenticated caller
    # or by a student awarding badges to themselves.
    _current_user: User = Depends(require_role("admin", "mentor")),
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