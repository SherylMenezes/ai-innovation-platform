from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas.leaderboard import LeaderboardScope, LeaderboardPeriod, LeaderboardEntry, LeaderboardResponse

router = APIRouter(prefix="/api/leaderboard", tags=["Leaderboard"])


def format_student_name(full_name: str, is_current_user: bool) -> str:
    """Privacy filter: show full name only to self, otherwise 'First LastInitial.'"""
    if is_current_user or not full_name:
        return full_name
    parts = full_name.strip().split()
    if len(parts) > 1:
        return f"{parts[0]} {parts[-1][0]}."
    return parts[0]


@router.get("/", response_model=LeaderboardResponse)
def get_leaderboard(
    scope: LeaderboardScope = Query("global"),
    period: LeaderboardPeriod = Query("all"),
    limit: int = 20,
    offset: int = 0,
    current_user_id: str = "1",  # Replace with your actual auth dependency
    db: Session = Depends(get_db)
):
    """
    Fetches the ranked leaderboard using SQL window functions for fair tie handling (1, 2, 2, 4),
    filtering out users with 0 XP and applying time periods (week, month, all).
    """
    date_filter = ""
    if period == "week":
        date_filter = "AND timestamp >= NOW() - INTERVAL '7 days'"
    elif period == "month":
        date_filter = "AND timestamp >= NOW() - INTERVAL '30 days'"

    query = text(f"""
        WITH filtered_history AS (
            SELECT user_id, challenge_id, xp_amount 
            FROM xp_history 
            WHERE 1=1 {date_filter}
        ),
        user_scores AS (
            SELECT 
                u.id::text as user_id,
                u.full_name,
                COALESCE(SUM(fh.xp_amount), 0) as total_xp,
                COUNT(DISTINCT fh.challenge_id) as challenges_completed,
                COALESCE(u.streak_count, 0) as streak,
                COALESCE(u.title, 'Novice') as title,
                DENSE_RANK() OVER (ORDER BY COALESCE(SUM(fh.xp_amount), 0) DESC) as rank
            FROM users u
            LEFT JOIN filtered_history fh ON u.id = fh.user_id
            GROUP BY u.id, u.full_name, u.streak_count, u.title
            HAVING COALESCE(SUM(fh.xp_amount), 0) > 0
        )
        SELECT * FROM user_scores
        ORDER BY rank ASC
        LIMIT :limit OFFSET :offset;
    """)
    
    rows = db.execute(query, {"limit": limit, "offset": offset}).fetchall()
    
    entries = []
    for row in rows:
        is_self = row.user_id == current_user_id
        entries.append(
            LeaderboardEntry(
                rank=row.rank,
                user_id=row.user_id,
                name=format_student_name(row.full_name, is_self),
                title=row.title,
                xp=row.total_xp,
                challenges_completed=row.challenges_completed,
                badges_earned=0,
                current_streak=row.streak,
                is_current_user=is_self
            )
        )

    position_query = text("""
        WITH ranked_users AS (
            SELECT 
                u.id::text as user_id,
                COALESCE(SUM(xh.xp_amount), 0) as total_xp,
                DENSE_RANK() OVER (ORDER BY COALESCE(SUM(xh.xp_amount), 0) DESC) as rank
            FROM users u
            LEFT JOIN xp_history xh ON u.id = xh.user_id
            GROUP BY u.id
        ),
        with_gap AS (
            SELECT 
                user_id,
                total_xp,
                rank,
                LAG(total_xp) OVER (ORDER BY rank ASC) as higher_xp
            FROM ranked_users
        )
        SELECT rank, total_xp, (higher_xp - total_xp) as xp_gap
        FROM with_gap
        WHERE user_id = :user_id;
    """)
    
    pos_row = db.execute(position_query, {"user_id": current_user_id}).fetchone()
    
    your_rank = pos_row.rank if pos_row else None
    xp_gap = abs(pos_row.xp_gap) if pos_row and pos_row.xp_gap else 0
    your_entry = next((e for e in entries if e.is_current_user), None)

    return LeaderboardResponse(
        scope=scope,
        scope_value="Global",
        period=period,
        entries=entries,
        your_rank=your_rank,
        your_entry=your_entry,
        xp_gap_to_next=xp_gap
    )