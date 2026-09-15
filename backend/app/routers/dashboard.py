from fastapi import APIRouter, Depends

from app.models.user import User
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.dashboard_service import build_dashboard_overview
from security import get_current_user


router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
)


@router.get(
    "/overview",
    response_model=DashboardOverviewResponse,
)
def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
):
    return build_dashboard_overview(current_user)