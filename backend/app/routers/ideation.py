"""
Per-user persistence for the Ideation Board. Freeform, SCAMPER, and Mind
Map are all views over the same note rows, scoped to the logged-in user
via get_current_user — one student's board never reads or writes another
student's notes.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.ideation import IdeationNote
from app.models.user import User
from app.schemas.ideation import NoteCreate, NoteResponse, NoteUpdate
from app.security import get_current_user

router = APIRouter(prefix="/api/ideation", tags=["ideation"])


def _get_owned_note(db: Session, note_id: str, user_id: str) -> IdeationNote:
    note = db.get(IdeationNote, note_id)
    if note is None or note.user_id != user_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found.")
    return note


@router.get("/notes", response_model=List[NoteResponse])
def list_notes(
    challenge_id: Optional[int] = Query(None, description="Scope notes to one challenge's workspace"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(IdeationNote).filter(IdeationNote.user_id == current_user.id)
    if challenge_id is not None:
        query = query.filter(IdeationNote.challenge_id == challenge_id)
    return query.order_by(IdeationNote.created_at.asc()).all()


@router.post("/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = IdeationNote(
        user_id=current_user.id,
        challenge_id=payload.challenge_id,
        text=payload.text,
        color=payload.color,
        x=payload.x,
        y=payload.y,
        technique=payload.technique,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.patch("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = _get_owned_note(db, note_id, current_user.id)

    if payload.text is not None:
        note.text = payload.text
    if payload.color is not None:
        note.color = payload.color
    if payload.x is not None:
        note.x = payload.x
    if payload.y is not None:
        note.y = payload.y
    if payload.clear_technique:
        note.technique = None
    elif payload.technique is not None:
        note.technique = payload.technique

    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    note = _get_owned_note(db, note_id, current_user.id)
    db.delete(note)
    db.commit()
