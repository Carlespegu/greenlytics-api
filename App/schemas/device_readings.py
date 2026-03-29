from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DeviceReadingIn(BaseModel):
    ts: Optional[datetime] = None
    temp_c: Optional[Decimal] = None
    hum_air: Optional[Decimal] = None
    ldr_raw: Optional[int] = None
    soil_percent: Optional[int] = None
    rain: Optional[str] = None
    rssi: Optional[int] = None
    plant_id: Optional[UUID] = None


class DeviceReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    device_id: UUID
    installation_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    plant_id: Optional[UUID] = None

    ts: datetime

    temp_c: Optional[Decimal] = None
    hum_air: Optional[Decimal] = None
    ldr_raw: Optional[int] = None
    soil_percent: Optional[int] = None
    rain: Optional[str] = None
    rssi: Optional[int] = None

    created_on: datetime
