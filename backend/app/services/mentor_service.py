from sqlalchemy.orm import Session

from app.models.mentor import MentorMessage


def record_message(db: Session, user_id: str, workspace_id: str, role: str, content: str, stage: str | None = None) -> MentorMessage:
    message = MentorMessage(
        user_id=user_id,
        workspace_id=workspace_id or "default",
        role=role,
        content=content,
        stage=stage,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_history(db: Session, user_id: str, workspace_id: str) -> list[MentorMessage]:
    return (
        db.query(MentorMessage)
        .filter(
            MentorMessage.user_id == user_id,
            MentorMessage.workspace_id == (workspace_id or "default"),
        )
        .order_by(MentorMessage.created_at.asc())
        .all()
    )
