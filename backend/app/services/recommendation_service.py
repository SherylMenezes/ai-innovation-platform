from typing import List

from sqlalchemy.orm import Session

from app.models.challenge import Challenge, Enrollment
from app.models.user import User


TIER_DIFFICULTY = {
    "Grade 8-10": "Beginner",
    "Grade 11-12": "Beginner",
    "Graduate": "Medium",
    "Professional": "Advanced",
}


def calculate_recommendation_score(
    challenge: Challenge,
    user: User,
) -> int:
    """
    Calculate how suitable a challenge is for a user.

    Current recommendation factors:
    1. Academic tier vs challenge difficulty
    2. Learning tier match
    3. General fallback ranking
    """

    score = 0

    # Recommend difficulty based on the user's academic tier.
    preferred_difficulty = TIER_DIFFICULTY.get(
        user.academic_tier,
        "Medium",
    )

    if challenge.difficulty == preferred_difficulty:
        score += 50

    # A nearby difficulty is still reasonably suitable.
    difficulty_order = {
        "Beginner": 1,
        "Medium": 2,
        "Advanced": 3,
    }

    user_level = difficulty_order.get(preferred_difficulty, 2)
    challenge_level = difficulty_order.get(challenge.difficulty, 2)

    difference = abs(user_level - challenge_level)

    if difference == 1:
        score += 20

    # Give some preference to challenges with a defined learning tier.
    if challenge.learning_tier:
        score += 10

    return score


def get_recommended_challenges(
    db: Session,
    user: User,
    limit: int = 10,
) -> List[Challenge]:
    """
    Get personalized challenges for the current user.

    Already-enrolled challenges are excluded and the remaining
    challenges are ranked using the recommendation score.
    """

    enrolled_rows = (
        db.query(Enrollment.challenge_id)
        .filter(Enrollment.user_id == user.id)
        .all()
    )

    enrolled_ids = [row[0] for row in enrolled_rows]

    query = db.query(Challenge)

    if enrolled_ids:
        query = query.filter(~Challenge.id.in_(enrolled_ids))

    challenges = query.all()

    ranked_challenges = sorted(
        challenges,
        key=lambda challenge: (
            calculate_recommendation_score(challenge, user),
            challenge.created_at.timestamp()
            if challenge.created_at
            else 0,
        ),
        reverse=True,
    )

    return ranked_challenges[:limit]