"""
Day 3: lightweight in-process pub/sub so business logic (submissions,
task completion, etc.) can announce milestone events without knowing or
caring who reacts to them. app/services/gamification_listeners.py is one
such reactor — nothing stops another subsystem (e.g. notifications) from
subscribing to the same events later.
"""
import inspect
import logging
from collections import defaultdict
from enum import Enum
from typing import Any, Callable

logger = logging.getLogger(__name__)

EventHandler = Callable[[dict[str, Any]], Any]


class GamificationEvent(str, Enum):
    TASK_COMPLETED = "TASK_COMPLETED"
    CHALLENGE_SUBMITTED = "CHALLENGE_SUBMITTED"
    STREAK_CHECKIN = "STREAK_CHECKIN"


class EventBroker:
    """Minimal async-aware EventEmitter. emit() runs every handler
    registered for an event type; a handler raising an exception is
    logged and does not stop the remaining handlers from running."""

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = defaultdict(list)

    def on(self, event_type: str, handler: EventHandler) -> None:
        # Idempotent: registering the same handler for the same event type
        # twice (e.g. a test importing the listeners module more than
        # once, or a lifespan that somehow runs twice) must not cause it
        # to fire — and double-award XP — twice per event.
        handlers = self._handlers[event_type]
        if handler not in handlers:
            handlers.append(handler)

    async def emit(self, event_type: str, payload: dict[str, Any]) -> None:
        handlers = self._handlers.get(event_type, [])
        if not handlers:
            logger.debug("No listeners registered for event %s", event_type)
            return

        # A single handler can be registered for multiple event types (the
        # gamification listener is), so it needs to know which one fired —
        # inject it into the payload the handler actually receives rather
        # than relying on callers to pass it themselves.
        enriched_payload = {**payload, "event_type": event_type}

        for handler in handlers:
            try:
                result = handler(enriched_payload)
                if inspect.isawaitable(result):
                    await result
            except Exception:
                logger.exception(
                    "Gamification event handler %s failed for event %s (payload=%s)",
                    getattr(handler, "__name__", handler), event_type, payload,
                )


# Module-level singleton — import this instance everywhere rather than
# instantiating EventBroker() again, so publishers and subscribers share
# the same handler registry.
event_broker = EventBroker()
