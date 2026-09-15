from typing import Optional

from pydantic import BaseModel


class QuickLink(BaseModel):
    label: str
    path: str


class ActiveProject(BaseModel):
    id: str
    title: str
    status: str


class DashboardOverviewResponse(BaseModel):
    user_id: str
    name: str
    academic_tier: str

    active_project: Optional[ActiveProject] = None

    notifications_count: int

    xp: int
    badges: list[str]

    quick_links: list[QuickLink]