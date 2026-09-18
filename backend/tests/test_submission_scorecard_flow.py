import pytest
from app.database import SessionLocal
from app.models.challenge import Challenge
from app.models.submission import Submission, Scorecard
from app.models.user import User


def test_full_submission_to_scorecard_flow(client, auth_headers):
    db = SessionLocal()

    # 1. Fetch or create the test user associated with auth_headers
    # If users table has records, take the first active student/user
    user = db.query(User).first()
    if not user:
        user = User(
            email="testuser@example.com",
            role="student",
            tier="Graduate"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    user_id = user.id

    # 2. Create Challenge & Submission
    challenge = Challenge(
        title="Predictive AI Track",
        domain="AI/ML",
        difficulty="Intermediate",
        description="Testing flow"
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    submission = Submission(
        challenge_id=challenge.id,
        user_id=user_id,
        file_url="https://supabase.co/storage/v1/object/public/submissions/demo.pdf",
        status="evaluating"
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    submission_id = submission.id

    # 3. Scorecard does not exist yet -> returns 404
    res_initial = client.get(f"/api/submissions/{submission_id}/scorecard", headers=auth_headers)
    assert res_initial.status_code == 404

    # 4. Simulate evaluation completion writing scorecard
    card = Scorecard(
        submission_id=submission_id,
        innovation_score=88.5,
        feasibility_score=92.0,
        impact_score=85.0,
        overall_score=88.5,
        feedback="Outstanding edge case handling."
    )
    submission.status = "evaluated"
    db.add(card)
    db.commit()
    db.close()

    # 5. Fetch Scorecard -> returns 200 with full breakdown
    res_final = client.get(f"/api/submissions/{submission_id}/scorecard", headers=auth_headers)
    assert res_final.status_code == 200
    data = res_final.json()
    assert data["submission_id"] == submission_id
    assert data["overall_score"] == 88.5
    assert "edge case" in data["feedback"]