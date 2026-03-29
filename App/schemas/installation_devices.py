from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class InstallationDeviceCreate(BaseModel):
    installation_id: UUID
    device_id: UUID
    assigned_on: Optional[datetime] = None
    unassigned_on: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool = True
    created_by: Optional[str] = None


class InstallationDeviceUpdate(BaseModel):
    installation_id: Optional[UUID] = None
    device_id: Optional[UUID] = None
    assigned_on: Optional[datetime] = None
    unassigned_on: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None
    modified_by: Optional[str] = None


class InstallationDeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    installation_id: UUID
    device_id: UUID

    assigned_on: datetime
    unassigned_on: Optional[datetime] = None
    notes: Optional[str] = None
    is_active: bool

    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
