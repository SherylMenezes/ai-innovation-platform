from typing import List, Literal, Optional
from pydantic import BaseModel

LeaderboardScope = Literal["global", "institution", "class"]
LeaderboardPeriod = Literal["week", "month", "all"]


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    name: str  # Formatted privacy name for others, full name for self
    title: str = "Novice"  # e.g., "Problem Solver", "Innovator"
    xp: int
    challenges_completed: int = 0
    badges_earned: int = 0
    current_streak: int
    is_current_user: bool


class LeaderboardResponse(BaseModel):
    scope: LeaderboardScope
    scope_value: Optional[str] = None  # e.g., Institution name or Grade tier
    period: LeaderboardPeriod = "all"
    entries: List[LeaderboardEntry]
    your_rank: Optional[int] = None
    your_entry: Optional[LeaderboardEntry] = None
    xp_gap_to_next: Optional[int] = None  # Powers the card showing XP needed to reach the next rank