from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models.challenge import Challenge, Enrollment
from app.models.user import User
from app.schemas.challenge import ChallengeResponse, EnrollmentResponse
from app.services.storage_service import storage_service
from app.security import get_current_user

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

# GET /api/challenges (filtered listing)
@router.get("", response_model=List[ChallengeResponse])
def get_challenges(
    domain: Optional[str] = Query(None, description="Filter by domain (e.g., AI/ML, Web)"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty"),
    tier: Optional[str] = Query(None, description="Filter by learning tier"),
    search: Optional[str] = Query(None, description="Search in title/description"),
    db: Session = Depends(get_db)
):
    query = db.query(Challenge)
    if domain:
        query = query.filter(Challenge.domain.ilike(f"%{domain}%"))
    if difficulty:
        query = query.filter(Challenge.difficulty == difficulty)
    if tier:
        query = query.filter(Challenge.learning_tier == tier)
    if search:
        query = query.filter(
            Challenge.title.ilike(f"%{search}%") | Challenge.description.ilike(f"%{search}%")
        )
    return query.all()

# Day 2: GET /api/challenges/{id} (detail + constraints)
@router.get("/{id}", response_model=ChallengeResponse)
def get_challenge_detail(id: int, db: Session = Depends(get_db)):
    challenge = db.query(Challenge).filter(Challenge.id == id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
    return challenge

# POST /api/challenges/{id}/enroll
@router.post("/{id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def enroll_in_challenge(
    id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == id).first()
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")

    existing_enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == current_user["id"],
        Enrollment.challenge_id == id
    ).first()
    if existing_enrollment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already enrolled in this challenge")

    enrollment = Enrollment(user_id=current_user["id"], challenge_id=id)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment

# Test file upload for storage groundwork (Epic 4.1)
@router.post("/test-upload")
def test_file_upload(file: UploadFile = File(...)):
    url = storage_service.upload_file(file)
    return {"status": "success", "file_url": url}