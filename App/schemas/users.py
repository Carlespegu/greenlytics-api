from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
    client_id: UUID
    role_id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    client_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    email: Optional[str] = None
    client_id: UUID
    role_id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    created_on: Optional[datetime] = None
    modified_on: Optional[datetime] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool
