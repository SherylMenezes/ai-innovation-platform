"""Submission badges: unlocked once a challenge submission is AI-evaluated,
based on its overall_score (out of 20). Each badge can be earned once per
user (UserBadge's unique constraint), pays a one-off XP bonus, and drops a
notification so the student actually finds out about it.

The BADGE_EARNED XPTransaction's metadata records which challenge and
submission unlocked the badge, since UserBadge itself has no challenge
column — workspace_service reads it back to show per-challenge badges."""
import logging
from datetime import datetime

from sqlalchemy import and_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.gamification import Badge, UserBadge
from app.models.notification import Notification
from app.services.gamification_service import award_xp

logger = logging.getLogger(__name__)

# (slug, minimum overall_score out of 20, bonus XP)
SUBMISSION_BADGE_RULES = [
    ("challenge_completer", 0, 25),
    ("high_achiever", 16, 50),
    ("perfectionist", 19, 100),
]


def list_badges_for_user(db: Session, user_id: str) -> list[tuple[Badge, datetime | None]]:
    """Every badge with the user's awarded_at (None if still locked), in
    one query rather than separate badge and user_badge lookups."""
    stmt = (
        select(Badge, UserBadge.awarded_at)
        .outerjoin(UserBadge, and_(UserBadge.badge_id == Badge.id, UserBadge.user_id == user_id))
        .order_by(Badge.id)
    )
    return [(badge, awarded_at) for badge, awarded_at in db.execute(stmt).all()]


async def award_submission_badges(
    db: Session, user_id: str, challenge_id: int, submission_id: int, overall_score: float
) -> list[Badge]:
    """Returns only the badges newly unlocked by this evaluation."""
    newly_earned: list[Badge] = []

    for slug, min_score, bonus_xp in SUBMISSION_BADGE_RULES:
        if overall_score < min_score:
            continue
        badge = db.query(Badge).filter(Badge.slug == slug).first()
        if badge is None:
            continue
        already_awarded = (
            db.query(UserBadge)
            .filter(UserBadge.user_id == user_id, UserBadge.badge_id == badge.id)
            .first()
        )
        if already_awarded is not None:
            continue

        db.add(UserBadge(user_id=user_id, badge_id=badge.id))
        db.add(
            Notification(
                user_id=user_id,
                title=f"Badge unlocked: {badge.name}",
                message=f"{badge.description} (+{bonus_xp} XP)",
                notification_type="badge",
            )
        )
        try:
            db.commit()
        except IntegrityError:
            # A concurrent evaluation got there first — it's theirs to pay.
            db.rollback()
            continue

        newly_earned.append(badge)
        try:
            await award_xp(
                db,
                user_id,
                bonus_xp,
                "BADGE_EARNED",
                {"challenge_id": challenge_id, "submission_id": submission_id, "badge_slug": slug},
            )
        except Exception:
            logger.exception("Failed to award badge XP for %s to user %s", slug, user_id)

    return newly_earned
