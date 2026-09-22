"""One-time seed for demo/dev data. Idempotent — only inserts when the
target table is empty, so it's safe to call on every startup."""
from sqlalchemy.orm import Session

from app.models.challenge import Challenge
from app.models.gamification import Badge

SAMPLE_BADGES = [
    {
        "slug": "challenge_completer",
        "name": "Challenge Completer",
        "description": "Submitted and completed a full project challenge.",
    },
    {
        "slug": "high_achiever",
        "name": "High Achiever",
        "description": "Scored 16/20 or higher on an AI-evaluated submission.",
    },
    {
        "slug": "perfectionist",
        "name": "Perfectionist",
        "description": "Scored 19/20 or higher on an AI-evaluated submission.",
    },
]

SAMPLE_CHALLENGES = [
    {
        "title": "AI Triage Assistant for Rural Clinics",
        "domain": "Healthcare",
        "difficulty": "Medium",
        "description": "Design a lightweight tool that helps under-staffed rural clinics triage patients by urgency using symptoms reported at intake.",
        "constraints": ["Must work offline or on low bandwidth", "No PII leaves the device"],
        "learning_tier": "Graduate",
    },
    {
        "title": "Food Waste Reduction Network",
        "domain": "Sustainability",
        "difficulty": "Beginner",
        "description": "Connect restaurants with surplus food to nearby shelters and food banks before it's thrown away.",
        "constraints": ["Must support same-day pickup coordination"],
        "learning_tier": "Grade 11-12",
    },
    {
        "title": "Smart Irrigation Scheduler",
        "domain": "Agriculture",
        "difficulty": "Medium",
        "description": "Build a scheduling system that recommends irrigation timing for smallholder farms based on soil moisture and weather forecasts.",
        "constraints": ["Must run on low-cost IoT hardware"],
        "learning_tier": "Graduate",
    },
    {
        "title": "Micro-Savings Tracker for Gig Workers",
        "domain": "Finance",
        "difficulty": "Beginner",
        "description": "Help gig economy workers with irregular income automatically set aside small savings toward goals.",
        "constraints": ["Must handle irregular/unpredictable income patterns"],
        "learning_tier": "Grade 11-12",
    },
    {
        "title": "Early Warning System for Crop Disease",
        "domain": "Agriculture",
        "difficulty": "Advanced",
        "description": "Use image classification to flag likely crop disease from a phone photo and suggest next steps.",
        "constraints": ["Must work with low-resolution phone cameras"],
        "learning_tier": "Professional",
    },
    {
        "title": "Mental Health Check-In Companion",
        "domain": "Healthcare",
        "difficulty": "Medium",
        "description": "Design a daily check-in experience that helps students notice mood/stress patterns and surfaces resources when needed.",
        "constraints": ["Must never replace professional care — resource referral only"],
        "learning_tier": "Grade 8-10",
    },
    {
        "title": "Community Solar Credit Marketplace",
        "domain": "Sustainability",
        "difficulty": "Advanced",
        "description": "Let households with rooftop solar sell surplus credits to neighbors who can't install panels themselves.",
        "constraints": ["Must reconcile with local utility billing cycles"],
        "learning_tier": "Professional",
    },
    {
        "title": "Student Micro-Loan Circle",
        "domain": "Finance",
        "difficulty": "Medium",
        "description": "Build a peer lending-circle tool that helps students pool small emergency loans with transparent repayment tracking.",
        "constraints": ["Must make default risk and terms clearly visible upfront"],
        "learning_tier": "Grade 11-12",
    },
]


def seed_challenges(db: Session) -> None:
    if db.query(Challenge).first() is not None:
        return

    for data in SAMPLE_CHALLENGES:
        db.add(Challenge(**data))
    db.commit()


def seed_badges(db: Session) -> None:
    existing_slugs = {b.slug for b in db.query(Badge).all()}
    for data in SAMPLE_BADGES:
        if data["slug"] not in existing_slugs:
            db.add(Badge(**data))
    db.commit()
