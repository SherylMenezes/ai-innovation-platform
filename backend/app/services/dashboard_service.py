from sqlalchemy.orm import Session

from app.models.challenge import Enrollment
from app.models.notification import Notification


def get_dashboard_overview(db: Session, user_id: int):

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

    # -----------------------------------
    # WEEK 2 PLACEHOLDER GAMIFICATION DATA
    # Real XP/streak system is Week 3.
    # -----------------------------------

    current_xp = 350
    next_level_xp = 500
    level = 2

    progress_percent = round(
        (current_xp / next_level_xp) * 100,
        2
    )

    badges = [
        {
            "name": "First Challenge",
            "description": "Enrolled in your first challenge",
            "earned": active_projects > 0
        },
        {
            "name": "Explorer",
            "description": "Started exploring innovation challenges",
            "earned": True
        },
        {
            "name": "Project Finisher",
            "description": "Completed your first project",
            "earned": completed_projects > 0
        }
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