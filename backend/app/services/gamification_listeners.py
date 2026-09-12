"""
Day 3: registers the handlers that react to gamification milestone
events by awarding XP (and, for STREAK_CHECKIN, updating the streak
first). register_gamification_listeners() is called once from main.py's
lifespan at startup — explicit registration rather than relying on
import-order side effects.
"""
import logging

from app.core.database import SessionLocal
from app.services.event_broker import GamificationEvent, event_broker
from app.services.gamification_service import (
    UserNotFoundError,
    award_xp,
    record_streak_checkin,
)

logger = logging.getLogger(__name__)

# Extensible reward rule configuration — add a new event type here and it
# automatically starts awarding XP the moment something emits it, with no
# other code changes required.
REWARD_RULES: dict[str, int] = {
    GamificationEvent.TASK_COMPLETED: 10,
    GamificationEvent.CHALLENGE_SUBMITTED: 50,
    GamificationEvent.STREAK_CHECKIN: 5,
}


async def handle_milestone_event(payload: dict) -> None:
    user_id = payload.get("user_id")
    event_type = payload.get("event_type")
    metadata = payload.get("metadata") or {}

    if not user_id or not event_type:
        logger.warning("Ignoring malformed gamification event payload: %s", payload)
        return

    points = REWARD_RULES.get(event_type)
    if points is None:
        logger.warning("No reward rule configured for event type %s — skipping.", event_type)
        return

    # Listeners run outside request scope, so they open their own DB
    # session rather than depending on FastAPI's get_db().
    db = SessionLocal()
    try:
        if event_type == GamificationEvent.STREAK_CHECKIN:
            await record_streak_checkin(db, user_id)

        await award_xp(db, user_id, points, event_type, metadata)
    except UserNotFoundError:
        logger.warning(
            "Gamification event for unknown user_id=%s (event=%s) — skipping.", user_id, event_type
        )
    except Exception:
        logger.exception("Failed to process gamification event %s for user %s", event_type, user_id)
    finally:
        db.close()


def register_gamification_listeners() -> None:
    for event_type in (
        GamificationEvent.TASK_COMPLETED,
        GamificationEvent.CHALLENGE_SUBMITTED,
        GamificationEvent.STREAK_CHECKIN,
    ):
        event_broker.on(event_type, handle_milestone_event)

    logger.info("Gamification event listeners registered.")
