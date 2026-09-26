from typing import List, Literal, Optional

from pydantic import BaseModel

LeaderboardScope = Literal["global", "institution", "class"]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str
    xp: int
    # Player Rank title from XP (e.g. "Problem Solver") — `rank` above is
    # the leaderboard position.
    rank_title: str = ""
    current_streak: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    scope: LeaderboardScope
    scope_value: Optional[str] = None
    entries: List[LeaderboardEntry]
    your_rank: Optional[int] = None
    your_entry: Optional[LeaderboardEntry] = None
