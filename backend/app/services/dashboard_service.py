from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.challenge import Enrollment
from app.models.gamification import UserGamificationProfile
from app.models.notification import Notification
from app.services.badge_service import list_badges_for_user
from app.services.player_rank import rank_for_xp


def _count(model, *conditions):
    return select(func.count()).select_from(model).where(*conditions).scalar_subquery()


def get_dashboard_overview(db: Session, user_id: str):
    # Every number on the dashboard in a single round trip — the database
    # is far away, so four separate COUNT/SELECTs would each cost a full
    # network hop.
    active_projects, completed_projects, unread_notifications, total_xp = db.execute(
        select(
            _count(Enrollment, Enrollment.user_id == user_id, Enrollment.status == "active"),
            _count(Enrollment, Enrollment.user_id == user_id, Enrollment.status == "completed"),
            _count(Notification, Notification.user_id == user_id, Notification.is_read.is_(False)),
            select(UserGamificationProfile.total_xp)
            .where(UserGamificationProfile.user_id == user_id)
            .scalar_subquery(),
        )
    ).one()
    total_xp = total_xp or 0

    badges = [
        {
            "slug": b.slug,
            "name": b.name,
            "description": b.description,
            "earned": awarded_at is not None,
        }
        for b, awarded_at in list_badges_for_user(db, user_id)
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

        "rank": rank_for_xp(total_xp).as_dict(),

        "badges": badges,

        "unread_notifications": unread_notifications,

        "quick_links": quick_links
    }