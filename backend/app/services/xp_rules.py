"""Single source of truth for how a challenge is split into Levels and
how much XP each part of it is worth. workspace_service, the submissions
router and evaluation_job_service all read from here, so rebalancing the
game is a one-file change."""

# A challenge is played as four Levels, one per Enrollment.current_stage
# value. "completed" isn't a Level — it's the state after Level 4 is
# evaluated.
CHALLENGE_LEVELS = [
    {"number": 1, "stage": "canvas", "name": "Problem Canvas"},
    {"number": 2, "stage": "ideation", "name": "Ideate"},
    {"number": 3, "stage": "evaluation", "name": "Idea Evaluation"},
    {"number": 4, "stage": "submission", "name": "Submit Project"},
]
TOTAL_LEVELS = len(CHALLENGE_LEVELS)
LEVEL_BY_STAGE = {level["stage"]: level for level in CHALLENGE_LEVELS}

# Every step key the frontend may credit, mapped to (stage it belongs to,
# base XP). Anything not listed here is rejected, so a client can't mint
# XP by inventing new step keys.
STEP_XP: dict[str, tuple[str, int]] = {
    "canvas_step_1": ("canvas", 5),        # read the problem statement
    "canvas_step_2": ("canvas", 15),       # 5 Whys
    "canvas_step_3": ("canvas", 15),       # root cause + How Might We
    "ideation_complete": ("ideation", 20), # SCAMPER / Mind Map + pick an idea
    "eval_swot": ("evaluation", 15),       # AI SWOT — optional bonus task
    "eval_scoring": ("evaluation", 15),    # AI scoring — optional bonus task
    "eval_complete": ("evaluation", 10),
}

# Steps that must be credited before a Level can be cleared. eval_swot and
# eval_scoring are only recorded when the student uses the AI helpers, so
# they're bonus XP rather than a gate.
LEVEL_REQUIRED_STEPS: dict[str, list[str]] = {
    "canvas": ["canvas_step_1", "canvas_step_2", "canvas_step_3"],
    "ideation": ["ideation_complete"],
    "evaluation": ["eval_complete"],
}

LEVEL_CLEAR_XP = 20
SUBMISSION_XP = 50
SCORE_XP_PER_POINT = 5  # overall_score is out of 20, so up to 100 XP
PASS_SCORE = 10
PASS_BONUS_XP = 25
STREAK_CHECKIN_XP = 10

DIFFICULTY_MULTIPLIER = {
    "beginner": 1.0,
    "easy": 1.0,
    "medium": 1.25,
    "intermediate": 1.25,
    "advanced": 1.5,
    "hard": 1.5,
}

# Reward keys recorded in Enrollment.completed_steps for one-off payouts,
# alongside the step keys above — that list is what makes every challenge
# reward idempotent.
SUBMITTED_KEY = "submitted"
EVALUATED_KEY = "evaluated"


def level_clear_key(stage: str) -> str:
    return f"level_clear:{stage}"


def difficulty_multiplier(difficulty: str | None) -> float:
    return DIFFICULTY_MULTIPLIER.get((difficulty or "").strip().lower(), 1.0)


def scale(points: int, difficulty: str | None) -> int:
    return round(points * difficulty_multiplier(difficulty))


def evaluation_xp(overall_score: float) -> int:
    """Base (unscaled) XP for an AI-evaluated submission."""
    points = round(overall_score) * SCORE_XP_PER_POINT
    if overall_score >= PASS_SCORE:
        points += PASS_BONUS_XP
    return points


def level_xp_available(stage: str, difficulty: str | None) -> int:
    """Most XP a Level can pay out, scaled per award exactly as the awards
    themselves are (so the displayed cap always matches what's earnable)."""
    if stage == "submission":
        return scale(SUBMISSION_XP, difficulty) + scale(evaluation_xp(20), difficulty)
    step_total = sum(scale(xp, difficulty) for s, xp in STEP_XP.values() if s == stage)
    return step_total + scale(LEVEL_CLEAR_XP, difficulty)
