import logging
import time
from concurrent.futures import ThreadPoolExecutor

from fastapi import Request
from sqlalchemy import create_engine, event, exc
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)

def _resolve_database_url(url: str) -> str:
    """Prefers psycopg2 over pg8000 for PostgreSQL whenever psycopg2 can
    load. Against the hosted database, pg8000 spends ~3 network round
    trips per parameterized query (and per ROLLBACK) where psycopg2 spends
    one — about 3x slower on every request. pg8000 stays as the automatic
    fallback for machines whose Application Control policy blocks
    psycopg2's compiled DLL (see requirements.txt), so DATABASE_URL can
    name either driver."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)

    scheme, sep, rest = url.partition("://")
    if scheme not in ("postgresql", "postgresql+pg8000", "postgresql+psycopg2"):
        return url

    try:
        import psycopg2  # noqa: F401
        driver = "psycopg2"
    except ImportError:
        driver = "pg8000"
    logger.info("Using the %s PostgreSQL driver", driver)
    return f"postgresql+{driver}{sep}{rest}"


db_url = _resolve_database_url(settings.database_url)

is_sqlite = db_url.startswith("sqlite")
connect_args = {
    # Disables psycopg2's automatic server-side prepared statements
    "prepare_threshold": None,
}

# The hosted database is a long network hop away, so every round trip
# costs hundreds of milliseconds. Everything below is about spending as
# few of them per request as possible:
#   - no pool_pre_ping: it pings on *every* checkout. _ping_if_idle()
#     below only pings connections that have sat unused for a while.
#   - pool_recycle retires connections before the Supabase pooler's idle
#     timeout can silently drop them.

# Cap pool_size and eliminate overflow so local processes don't burst beyond Supabase's cap
engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_size=settings.db_pool_size if hasattr(settings, 'db_pool_size') and settings.db_pool_size <= 4 else 4,
    max_overflow=2,  # Gives headroom for warm-up + startup inspection without hitting Supabase's 15 limit
    pool_recycle=settings.db_pool_recycle_seconds,
)

# Shares the pool above. For psycopg2, AUTOCOMMIT is a client-side flag
# (no round trip to set it), and it skips the separate BEGIN psycopg2
# sends before a transaction's first query and the ROLLBACK when the
# connection is returned — two round trips saved on every read.
autocommit_engine = engine.execution_options(isolation_level="AUTOCOMMIT")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
ReadSessionLocal = sessionmaker(autoflush=False, bind=autocommit_engine)

READ_ONLY_METHODS = {"GET", "HEAD", "OPTIONS"}


@event.listens_for(engine, "checkin")
def _mark_last_used(dbapi_connection, connection_record):
    connection_record.info["last_used"] = time.monotonic()


@event.listens_for(engine, "checkout")
def _ping_if_idle(dbapi_connection, connection_record, connection_proxy):
    """Pessimistic disconnect check, but only for connections idle longer
    than db_ping_after_idle_seconds — a busy connection was just proven
    alive by the previous request, so pinging it again is a wasted round
    trip. Raising DisconnectionError makes the pool discard this
    connection and transparently hand out a fresh one."""
    if is_sqlite:
        return
    last_used = connection_record.info.get("last_used")
    if last_used is None or time.monotonic() - last_used < settings.db_ping_after_idle_seconds:
        return
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("SELECT 1")
    except Exception as err:
        raise exc.DisconnectionError() from err
    finally:
        cursor.close()
    # A ping on a non-autocommit psycopg2 connection opens a transaction —
    # end it so the checkout hands back a clean connection.
    if not getattr(dbapi_connection, "autocommit", True):
        dbapi_connection.rollback()


def warm_up_pool() -> None:
    """Opens pool connections in parallel at startup to absorb TCP + TLS +
    pooler handshake costs before incoming traffic arrives."""
    if is_sqlite:
        return

    # Derive warm-up capacity directly from the engine's configured pool size
    pool_capacity = getattr(engine.pool, "size", lambda: getattr(settings, "db_pool_size", 4))()
    # If another startup check is running, keep 1 slot free
    warm_count = max(1, min(pool_capacity, getattr(settings, "db_pool_size", pool_capacity)) - 1)

    def _warm_one(_: int) -> None:
        # Check out to establish the socket, then close immediately back to the pool
        with engine.connect():
            pass

    started = time.perf_counter()
    try:
        with ThreadPoolExecutor(max_workers=warm_count) as executor:
            list(executor.map(_warm_one, range(warm_count)))

        logger.info(
            "Warmed %s database connections in %.2fs",
            warm_count,
            time.perf_counter() - started,
        )
    except Exception:
        logger.exception("Database pool warm-up failed — connections will open on demand instead.")

class Base(DeclarativeBase):
    pass


def get_db(request: Request = None):
    # Read-only HTTP methods get an autocommit session (see
    # autocommit_engine above); anything that writes keeps a normal
    # transaction. FastAPI injects `request`; direct callers (tests,
    # scripts) get the transactional session.
    if request is not None and request.method in READ_ONLY_METHODS:
        db = ReadSessionLocal()
    else:
        db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
