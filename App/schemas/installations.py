from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InstallationCreate(BaseModel):
    client_id: UUID
    code: str
    name: str
    description: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    is_active: bool = True
    created_by: Optional[str] = None


class InstallationUpdate(BaseModel):
    client_id: Optional[UUID] = None
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    is_active: Optional[bool] = None
    modified_by: Optional[str] = None


class InstallationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    code: str
    name: str
    description: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None

    is_active: bool
    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool
