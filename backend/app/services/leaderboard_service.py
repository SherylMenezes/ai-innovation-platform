"""
Week 4 Day 1-2 (Epic 5.2): real-time leaderboard ranking + the score
aggregation behind it. "Real-time" here means every call re-aggregates
live XP straight from the database — there's no batch/cron snapshot to
go stale, which is the right tradeoff at this scale (a cohort leaderboard
read a few times a minute, not a global leaderboard read a million times
a second).
"""
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.gamification import UserGamificationProfile
from app.models.user import User
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse, LeaderboardScope


class InvalidScopeError(Exception):
    pass


def _aggregate_scope(db: Session, scope: LeaderboardScope, current_user: User) -> tuple[list[tuple[User, int, int]], str | None]:
    """Returns (rows, scope_value) where rows are (user, xp, current_streak)
    tuples for every student in the requested scope, XP-descending. A
    left join keeps students with no gamification activity yet on the
    board at 0 XP rather than silently excluding them."""
    query = (
        db.query(
            User,
            func.coalesce(UserGamificationProfile.total_xp, 0),
            func.coalesce(UserGamificationProfile.current_streak, 0),
        )
        .outerjoin(UserGamificationProfile, UserGamificationProfile.user_id == User.id)
        .filter(User.role == "student")
    )

    scope_value: str | None = None
    if scope == "institution":
        scope_value = current_user.institution_name
        if not scope_value:
            raise InvalidScopeError("Your account has no institution set, so an institution-scoped leaderboard isn't meaningful yet.")
        query = query.filter(User.institution_name == scope_value)
    elif scope == "class":
        scope_value = current_user.academic_tier
        query = query.filter(User.academic_tier == scope_value)
    elif scope != "global":
        raise InvalidScopeError(f"Unknown leaderboard scope {scope!r}.")

    # XP desc, then a stable tiebreak (name) so repeated calls with equal
    # scores don't reorder between requests.
    rows = query.order_by(func.coalesce(UserGamificationProfile.total_xp, 0).desc(), User.name.asc()).all()
    return rows, scope_value


def get_leaderboard(db: Session, scope: LeaderboardScope, current_user: User, limit: int = 20) -> LeaderboardResponse:
    rows, scope_value = _aggregate_scope(db, scope, current_user)

    def to_entry(rank: int, user: User, xp: int, streak: int) -> LeaderboardEntry:
        return LeaderboardEntry(
            rank=rank,
            user_id=user.id,
            name=user.name,
            xp=xp,
            current_streak=streak,
            is_current_user=(user.id == current_user.id),
        )

    ranked = [to_entry(i + 1, user, xp, streak) for i, (user, xp, streak) in enumerate(rows)]

    your_entry = next((e for e in ranked if e.is_current_user), None)

    return LeaderboardResponse(
        scope=scope,
        scope_value=scope_value,
        entries=ranked[:limit],
        your_rank=your_entry.rank if your_entry else None,
        your_entry=your_entry,
    )
