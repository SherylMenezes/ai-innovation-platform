from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationResponse
from security import get_current_user


router = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"]
)


# ---------------------------------------------------------
# GET ALL NOTIFICATIONS FOR CURRENT USER
# ---------------------------------------------------------

@router.get("", response_model=list[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


# ---------------------------------------------------------
# GET ONLY UNREAD NOTIFICATIONS
# ---------------------------------------------------------

@router.get("/unread", response_model=list[NotificationResponse])
def get_unread_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


# ---------------------------------------------------------
# GET UNREAD NOTIFICATION COUNT
# ---------------------------------------------------------

@router.get("/unread/count")
def get_unread_notification_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(func.count(Notification.id))
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .scalar()
    )

    return {
        "unread_count": count
    }


# ---------------------------------------------------------
# MARK ONE NOTIFICATION AS READ
# ---------------------------------------------------------

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification


# ---------------------------------------------------------
# MARK ALL NOTIFICATIONS AS READ
# ---------------------------------------------------------

@router.patch("/read-all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    updated_count = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
        .update(
            {"is_read": True},
            synchronize_session=False
        )
    )

    db.commit()

    return {
        "message": "All notifications marked as read",
        "updated_count": updated_count
    }


# ---------------------------------------------------------
# DELETE ONE NOTIFICATION
# ---------------------------------------------------------

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
        .first()
    )

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {
        "message": "Notification deleted successfully"
    }