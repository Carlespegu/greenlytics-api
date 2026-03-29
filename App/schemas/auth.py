from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CurrentUserResponse(BaseModel):
    id: UUID
    username: str
    email: Optional[str] = None
    client_id: UUID
    role_id: UUID
    role_code: str
    role_name: str
    is_active: bool
