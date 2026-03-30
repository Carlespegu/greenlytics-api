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

    # Branding MVP
    client_name: Optional[str] = None
    client_trade_name: Optional[str] = None
    app_name: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None