from app.models.user import User
from app.schemas.dashboard import (
    DashboardOverviewResponse,
    QuickLink,
)


def build_dashboard_overview(
    current_user: User,
) -> DashboardOverviewResponse:
    """
    Build the student dashboard overview.

    Some values are placeholders during Week 2 because
    projects, XP, badges, and notifications are implemented
    in later tasks.
    """

    quick_links = [
        QuickLink(
            label="Problem Canvas",
            path="/canvas",
        ),
        QuickLink(
            label="Ideation Board",
            path="/ideate",
        ),
        QuickLink(
            label="Challenge Catalog",
            path="/challenges",
        ),
    ]

    return DashboardOverviewResponse(
        user_id=current_user.id,
        name=current_user.name,
        academic_tier=current_user.academic_tier,

        # Will later come from project/enrollment data
        active_project=None,

        # Day 2 will connect real notifications
        notifications_count=0,

        # Week 2 Day 4 / Week 3 gamification work
        xp=0,
        badges=[],

        quick_links=quick_links,
    )