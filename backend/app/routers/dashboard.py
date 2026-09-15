from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user
from app.schemas.dashboard import DashboardOverview
from app.services.dashboard_service import get_dashboard_overview


router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"]
)


@router.get(
    "/overview",
    response_model=DashboardOverview
)
def dashboard_overview(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_dashboard_overview(
        db=db,
        user_id=current_user.id
    )