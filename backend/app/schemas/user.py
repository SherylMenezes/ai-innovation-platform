from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.models.user import AcademicTier


class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    academic_tier: str
    institution_name: Optional[str] = None
    is_verified: bool


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    academic_tier: Optional[AcademicTier] = None
    institution_name: Optional[str] = None


class RbacResponse(BaseModel):
    user_id: str
    role: str
    academic_tier: str
    permissions: list[str]