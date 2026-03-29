from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoleCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool = True


class RoleUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    is_active: bool

    created_on: Optional[datetime] = None
    modified_on: Optional[datetime] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool
