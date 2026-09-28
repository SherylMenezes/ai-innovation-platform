from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.challenge import Challenge
from app.schemas.challenge import ChallengeCreate

class ChallengeService:
    @staticmethod
    def get_all(db: Session, domain: Optional[str] = None) -> List[Challenge]:
        query = db.query(Challenge)
        if domain and domain.lower() != "all":
            query = query.filter(Challenge.domain.ilike(domain))
        return query.order_by(Challenge.id.desc()).all()

    @staticmethod
    def create(db: Session, data: ChallengeCreate, user_id: Optional[str] = None) -> Challenge:
        new_challenge = Challenge(
            title=data.title,
            domain=data.domain,
            difficulty=data.difficulty,
            description=data.description,
            constraints=data.constraints,
            learning_tier=data.learning_tier,
            created_by_id=user_id
        )
        db.add(new_challenge)
        db.commit()
        db.refresh(new_challenge)
        return new_challenge

challenge_service = ChallengeService()