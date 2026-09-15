from sqlalchemy.orm import Session

from app.models.notification import Notification


def get_user_notifications(
    db: Session,
    user_id: str
) -> list[Notification]:
    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .all()
    )

def mark_notification_as_read(
    db: Session,
    notification_id: str,
    user_id: str
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        .first()
    )

    if notification is None:
        return None

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification