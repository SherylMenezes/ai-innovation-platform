from pydantic import BaseModel
from typing import List, Optional


class XPData(BaseModel):
    current_xp: int
    next_level_xp: int
    level: int
    progress_percent: float


class BadgeData(BaseModel):
    name: str
    description: str
    earned: bool


class DashboardOverview(BaseModel):
    user_id: str

    active_projects: int
    completed_projects: int

    xp: XPData
    badges: List[BadgeData]

    unread_notifications: int

    quick_links: List[str]