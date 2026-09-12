"""
Day 2 core logic. award_xp() is the single choke point both the HTTP
endpoint (app/routers/gamification.py) and the event broker's listeners
(app/services/gamification_listeners.py) call, so there is exactly one
place that increments XP, writes the audit ledger, and syncs the cache.
"""
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.gamification import UserGamificationProfile, XPTransaction
from app.models.user import User
from app.services import gamification_cache

logger = logging.getLogger(__name__)


class UserNotFoundError(Exception):
    pass


@dataclass
class AwardXpResult:
    user_id: str
    points_awarded: int
    total_xp: int
    current_streak: int
    longest_streak: int
    source_event: str
    transaction_id: str


@dataclass
class StreakResult:
    current_streak: int
    longest_streak: int
    extended: bool


def _get_or_create_profile(db: Session, user_id: str) -> UserGamificationProfile:
    profile = db.get(UserGamificationProfile, user_id)
    if profile is None:
        profile = UserGamificationProfile(user_id=user_id)
        db.add(profile)
        db.flush()
    return profile


async def award_xp(
    db: Session,
    user_id: str,
    points: int,
    source_event: str,
    metadata: dict | None = None,
) -> AwardXpResult:
    if points <= 0:
        raise ValueError("points must be a positive integer.")

    user = db.get(User, user_id)
    if user is None:
        raise UserNotFoundError(f"No user found with id {user_id!r}.")

    profile = _get_or_create_profile(db, user_id)

    transaction = XPTransaction(
        user_id=user_id,
        points=points,
        source_event=source_event,
        event_metadata=metadata,
    )
    db.add(transaction)

    profile.total_xp += points
    db.commit()
    db.refresh(profile)
    db.refresh(transaction)

    # Best-effort fast-path mirror. The DB write above already succeeded
    # and is the durable source of truth regardless of what happens here.
    cached_total = await gamification_cache.add_cached_xp(user_id, points)
    if cached_total is None or cached_total != profile.total_xp:
        # Cache miss, outage, or drift (e.g. the cache started cold) —
        # resync it to the authoritative DB value rather than trust the delta.
        await gamification_cache.set_cached_xp(user_id, profile.total_xp)

    logger.info(
        "Awarded %s XP to user %s for %s (transaction %s, total now %s)",
        points, user_id, source_event, transaction.id, profile.total_xp,
    )

    return AwardXpResult(
        user_id=user_id,
        points_awarded=points,
        total_xp=profile.total_xp,
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        source_event=source_event,
        transaction_id=transaction.id,
    )


async def record_streak_checkin(db: Session, user_id: str) -> StreakResult:
    """Advances a user's streak on a STREAK_CHECKIN event: extends it if
    the last check-in was yesterday, resets to 1 if there's a gap of more
    than a day, and is a no-op if the user already checked in today."""
    user = db.get(User, user_id)
    if user is None:
        raise UserNotFoundError(f"No user found with id {user_id!r}.")

    profile = _get_or_create_profile(db, user_id)
    today = datetime.now(timezone.utc).date()

    extended = False
    if profile.last_checkin_date == today:
        pass  # already checked in today — no change
    elif profile.last_checkin_date == today - timedelta(days=1):
        profile.current_streak += 1
        extended = True
    else:
        profile.current_streak = 1
        extended = True

    profile.longest_streak = max(profile.longest_streak, profile.current_streak)
    profile.last_checkin_date = today
    db.commit()
    db.refresh(profile)

    await gamification_cache.set_cached_streak(user_id, profile.current_streak)

    logger.info(
        "Streak check-in for user %s: current=%s longest=%s",
        user_id, profile.current_streak, profile.longest_streak,
    )

    return StreakResult(
        current_streak=profile.current_streak,
        longest_streak=profile.longest_streak,
        extended=extended,
    )
