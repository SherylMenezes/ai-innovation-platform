"""
Day 1: Redis fast-access cache for XP totals and streak counters.

Every helper degrades gracefully on Redis errors — the database
(app/services/gamification_service.py) remains the source of truth, so a
Redis outage never breaks the award-xp flow, it only removes the fast-read
path until Redis recovers.
"""
import inspect
import logging
from typing import Awaitable, Callable

import redis.exceptions

from app.core.redis_client import redis_client
from config import settings

logger = logging.getLogger(__name__)

XP_KEY_PREFIX = "gamification:xp:"
STREAK_KEY_PREFIX = "gamification:streak:"


def _xp_key(user_id: str) -> str:
    return f"{XP_KEY_PREFIX}{user_id}"


def _streak_key(user_id: str) -> str:
    return f"{STREAK_KEY_PREFIX}{user_id}"


async def add_cached_xp(user_id: str, points: int) -> int | None:
    """Atomically increments the user's cached XP counter via INCRBY.
    Returns the new total, or None if Redis is unavailable (caller should
    treat the database value as authoritative)."""
    try:
        new_total = await redis_client.incrby(_xp_key(user_id), points)
        await redis_client.expire(_xp_key(user_id), settings.xp_cache_ttl_seconds)
        return new_total
    except redis.exceptions.RedisError:
        logger.warning("Redis unavailable — could not increment cached XP for user %s", user_id)
        return None


async def get_cached_xp(user_id: str) -> int | None:
    """Returns the cached XP total. None covers both a genuine cache miss
    and a Redis outage — callers can't tell the two apart and shouldn't
    need to; either way the correct move is to read the database."""
    try:
        value = await redis_client.get(_xp_key(user_id))
        return int(value) if value is not None else None
    except redis.exceptions.RedisError:
        logger.warning("Redis unavailable — could not read cached XP for user %s", user_id)
        return None


async def set_cached_xp(user_id: str, total_xp: int) -> None:
    """Read-through repopulation: sets the cache to an absolute value
    (e.g. loaded from the database after a miss), not a delta."""
    try:
        await redis_client.set(_xp_key(user_id), total_xp, ex=settings.xp_cache_ttl_seconds)
    except redis.exceptions.RedisError:
        logger.warning("Redis unavailable — could not repopulate cached XP for user %s", user_id)


async def set_cached_streak(user_id: str, streak_count: int, ttl_seconds: int | None = None) -> None:
    ttl = ttl_seconds if ttl_seconds is not None else settings.streak_cache_ttl_seconds
    try:
        await redis_client.set(_streak_key(user_id), streak_count, ex=ttl)
    except redis.exceptions.RedisError:
        logger.warning("Redis unavailable — could not set cached streak for user %s", user_id)


async def get_cached_streak(user_id: str) -> int | None:
    try:
        value = await redis_client.get(_streak_key(user_id))
        return int(value) if value is not None else None
    except redis.exceptions.RedisError:
        logger.warning("Redis unavailable — could not read cached streak for user %s", user_id)
        return None


async def invalidate_user_cache(user_id: str) -> None:
    """Drops both cached counters for a user. Used when the database value
    changes through a path that bypasses the increment helpers above (e.g.
    a manual admin correction), so the next read repopulates from the
    database instead of serving a stale cached number."""
    try:
        await redis_client.delete(_xp_key(user_id), _streak_key(user_id))
    except redis.exceptions.RedisError:
        logger.warning("Redis unavailable — could not invalidate cache for user %s", user_id)


async def get_xp_with_fallback(
    user_id: str,
    db_fallback: Callable[[str], int | Awaitable[int]],
) -> int:
    """Read-through cache: try Redis first; on a miss (or a Redis outage),
    call db_fallback(user_id) — sync or async, returning the authoritative
    XP total from the database — then repopulate the cache so the next
    read is fast again."""
    cached = await get_cached_xp(user_id)
    if cached is not None:
        return cached

    db_value = db_fallback(user_id)
    if inspect.isawaitable(db_value):
        db_value = await db_value

    await set_cached_xp(user_id, db_value)
    return db_value
