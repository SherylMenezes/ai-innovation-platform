from pydantic import BaseModel
from typing import List, Optional


class RankData(BaseModel):
    rank: int
    title: str
    total_xp: int
    xp_into_rank: int
    xp_for_next_rank: int
    progress_percent: float


class BadgeData(BaseModel):
    slug: str
    name: str
    description: str
    earned: bool


class DashboardOverview(BaseModel):
    user_id: str

    active_projects: int
    completed_projects: int

    rank: RankData
    badges: List[BadgeData]

    unread_notifications: int

    quick_links: List[str]