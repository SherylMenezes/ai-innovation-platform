from pydantic import BaseModel


class RbacResponse(BaseModel):
    user_id: str
    role: str
    permissions: list[str]
