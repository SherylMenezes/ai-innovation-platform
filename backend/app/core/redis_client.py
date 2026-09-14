"""
Redis connection for the gamification fast-access cache (XP counters,
streak counters). Uses redis.asyncio since routes/services that touch it
are async. The client is lazy — redis-py doesn't open a real socket until
the first command is issued, so importing this module never fails even if
Redis isn't running; individual commands are the ones that can fail, and
callers (app/services/gamification_cache.py) are responsible for catching
that and degrading gracefully to the database as source of truth.
"""
import redis.asyncio as redis

from app.config import settings

redis_client: redis.Redis = redis.from_url(
    settings.redis_url,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)
