from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator


class ReadingValueIn(BaseModel):
    reading_type_code: str
    value_decimal: Optional[Decimal] = None
    value_integer: Optional[int] = None
    value_text: Optional[str] = None
    value_boolean: Optional[bool] = None

    @model_validator(mode="after")
    def validate_single_value(self):
        values = [
            self.value_decimal,
            self.value_integer,
            self.value_text,
            self.value_boolean,
        ]
        populated = sum(v is not None for v in values)
        if populated != 1:
            raise ValueError("Exactly one value field must be informed")
        return self


class DeviceReadingIn(BaseModel):
    ts: Optional[datetime] = None
    plant_id: Optional[UUID] = None
    values: List[ReadingValueIn]


class ReadingValueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    reading_type_id: UUID
    value_decimal: Optional[Decimal] = None
    value_integer: Optional[int] = None
    value_text: Optional[str] = None
    value_boolean: Optional[bool] = None


class DeviceReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    device_id: UUID
    installation_id: Optional[UUID] = None
    client_id: Optional[UUID] = None
    plant_id: Optional[UUID] = None
    ts: datetime
    created_on: datetime
    values: List[ReadingValueResponse]


class DeviceReadingListItem(BaseModel):
    id: UUID
    device_id: UUID
    device_name: Optional[str] = None
    installation_id: Optional[UUID] = None
    installation_name: Optional[str] = None
    status: Optional[str] = None
    readAt: datetime
    created_at: datetime
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    light: Optional[float] = None
    humudity_soil: Optional[float] = None
    rain: Optional[float] = None
