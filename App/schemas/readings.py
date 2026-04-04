from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ReadingListItem(BaseModel):
    id: UUID
    ts: datetime
    created_on: Optional[datetime] = None

    client_id: Optional[UUID] = None
    installation_id: Optional[UUID] = None
    installation_name: Optional[str] = None

    device_id: Optional[UUID] = None
    device_name: Optional[str] = None

    plant_id: Optional[UUID] = None
    plant_name: Optional[str] = None

    status: Optional[str] = None
    temp_c: Optional[float] = None
    hum_air: Optional[float] = None
    soil_percent: Optional[float] = None
    ldr_raw: Optional[float] = None
    rain: Optional[str] = None
    rssi: Optional[int] = None
