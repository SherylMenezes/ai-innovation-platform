from fastapi import APIRouter, Depends

from app.models.user import User
from app.schemas.user import RbacResponse
from security import get_current_user, get_permissions

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/rbac", response_model=RbacResponse)
def rbac(current_user: User = Depends(get_current_user)):
    return RbacResponse(
        user_id=current_user.id,
        role=current_user.role,
        permissions=get_permissions(current_user.role),
    )
