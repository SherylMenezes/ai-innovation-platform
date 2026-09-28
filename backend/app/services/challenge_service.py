from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.schemas.challenge import ChallengeCreate


class ChallengeService:

    # =====================================================
    # GET CHALLENGES
    # =====================================================

    @staticmethod
    def get_all(
        db: Session,
        domain: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Challenge]:

        query = db.query(Challenge)

        # Domain filter
        if domain and domain.lower() != "all":

            query = query.filter(
                Challenge.domain.ilike(
                    f"%{domain}%"
                )
            )

        # Search
        if search:

            search_term = f"%{search}%"

            query = query.filter(
                Challenge.title.ilike(search_term)
                |
                Challenge.description.ilike(search_term)
                |
                Challenge.problem.ilike(search_term)
            )

        return (
            query
            .order_by(Challenge.id.desc())
            .all()
        )

    # =====================================================
    # CREATE CHALLENGE
    # =====================================================

    @staticmethod
    def create(
        db: Session,
        data: ChallengeCreate,
        user_id: Optional[str] = None,
    ) -> Challenge:

        challenge = Challenge(

            title=data.title,

            domain=data.domain,

            difficulty=data.difficulty,

            description=data.description,

            problem=data.problem,

            why_needed=data.why_needed,

            who_affected=data.who_affected,

            goal=data.goal,

            constraints=data.constraints,

            learning_tier=data.learning_tier,

            created_by_id=user_id,
        )

        db.add(challenge)

        db.commit()

        db.refresh(challenge)

        return challenge


challenge_service = ChallengeService()