from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import RbacResponse, UserProfileResponse, UserProfileUpdate
from app.security import get_current_user, get_permissions

router = APIRouter(prefix="/api/user", tags=["user"])

# Fetches the profile of the current user
@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

# Updates user name, academic tier, institution
@router.put("/profile", response_model=UserProfileResponse)
def update_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.academic_tier is not None:
        current_user.academic_tier = (
            payload.academic_tier.value 
            if hasattr(payload.academic_tier, "value") 
            else payload.academic_tier
        )
    if payload.institution_name is not None:
        current_user.institution_name = payload.institution_name

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/rbac", response_model=RbacResponse)
def rbac(current_user: User = Depends(get_current_user)):
    return RbacResponse(
        user_id=current_user.id,
        role=current_user.role,
        academic_tier=current_user.academic_tier,
        permissions=get_permissions(current_user.role),
    )
