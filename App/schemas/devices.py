from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DeviceCreate(BaseModel):
    device_type_id: UUID

    code: str
    name: str
    description: Optional[str] = None

    serial_number: Optional[str] = None
    mac_address: Optional[str] = None

    firmware_version: Optional[str] = None
    hardware_version: Optional[str] = None

    api_key: Optional[str] = None

    wifi_name: Optional[str] = None
    wifi_password: Optional[str] = None

    status: Optional[str] = "offline"
    last_seen_on: Optional[datetime] = None
    is_active: bool = True
    created_by: Optional[str] = None


class DeviceUpdate(BaseModel):
    device_type_id: Optional[UUID] = None

    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None

    serial_number: Optional[str] = None
    mac_address: Optional[str] = None

    firmware_version: Optional[str] = None
    hardware_version: Optional[str] = None

    api_key: Optional[str] = None

    wifi_name: Optional[str] = None
    wifi_password: Optional[str] = None

    status: Optional[str] = None
    last_seen_on: Optional[datetime] = None
    is_active: Optional[bool] = None
    modified_by: Optional[str] = None


class DeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    device_type_id: UUID

    code: str
    name: str
    description: Optional[str] = None

    serial_number: Optional[str] = None
    mac_address: Optional[str] = None

    firmware_version: Optional[str] = None
    hardware_version: Optional[str] = None

    api_key: Optional[str] = None

    wifi_name: Optional[str] = None
    wifi_password: Optional[str] = None

    status: Optional[str] = None
    last_seen_on: Optional[datetime] = None
    is_active: bool

    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool
