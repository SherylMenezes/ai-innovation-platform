from sqlalchemy.orm import Session

from app.models.challenge import Enrollment
from app.models.gamification import Badge, UserBadge, UserGamificationProfile
from app.models.notification import Notification

XP_PER_LEVEL = 100


def get_dashboard_overview(db: Session, user_id: str):

    active_projects = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user_id,
            Enrollment.status == "active"
        )
        .count()
    )

    completed_projects = (
        db.query(Enrollment)
        .filter(
            Enrollment.user_id == user_id,
            Enrollment.status == "completed"
        )
        .count()
    )

    unread_notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        )
        .count()
    )

    profile = db.get(UserGamificationProfile, user_id)
    total_xp = profile.total_xp if profile else 0

    level = (total_xp // XP_PER_LEVEL) + 1
    current_xp = total_xp % XP_PER_LEVEL
    next_level_xp = XP_PER_LEVEL

    progress_percent = round(
        (current_xp / next_level_xp) * 100,
        2
    )

    all_badges = db.query(Badge).all()
    unlocked_badge_ids = {
        ub.badge_id
        for ub in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
    }

    badges = [
        {
            "name": b.name,
            "description": b.description,
            "earned": b.id in unlocked_badge_ids,
        }
        for b in all_badges
    ]

    quick_links = [
        "/api/challenges",
        "/api/challenges/recommended",
        "/api/notifications"
    ]

    return {
        "user_id": user_id,

        "active_projects": active_projects,
        "completed_projects": completed_projects,

        "xp": {
            "current_xp": current_xp,
            "next_level_xp": next_level_xp,
            "level": level,
            "progress_percent": progress_percent
        },

        "badges": badges,

        "unread_notifications": unread_notifications,

        "quick_links": quick_links
    }