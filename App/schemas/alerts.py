from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class AlertCreate(BaseModel):
    client_id: UUID
    installation_id: Optional[UUID] = None
    plant_id: Optional[UUID] = None
    reading_type_id: UUID

    name: str
    description: Optional[str] = None

    channel: str = "EMAIL"
    recipient_email: Optional[EmailStr] = None

    condition_type: str

    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    exact_numeric_value: Optional[Decimal] = None
    exact_text_value: Optional[str] = None
    exact_boolean_value: Optional[bool] = None

    is_active: bool = True
    created_by: Optional[str] = None


class AlertUpdate(BaseModel):
    client_id: Optional[UUID] = None
    installation_id: Optional[UUID] = None
    plant_id: Optional[UUID] = None
    reading_type_id: Optional[UUID] = None

    name: Optional[str] = None
    description: Optional[str] = None

    channel: Optional[str] = None
    recipient_email: Optional[EmailStr] = None

    condition_type: Optional[str] = None

    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    exact_numeric_value: Optional[Decimal] = None
    exact_text_value: Optional[str] = None
    exact_boolean_value: Optional[bool] = None

    is_active: Optional[bool] = None
    modified_by: Optional[str] = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    installation_id: Optional[UUID] = None
    plant_id: Optional[UUID] = None
    reading_type_id: UUID

    name: str
    description: Optional[str] = None

    channel: str
    recipient_email: Optional[str] = None

    condition_type: str

    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    exact_numeric_value: Optional[Decimal] = None
    exact_text_value: Optional[str] = None
    exact_boolean_value: Optional[bool] = None

    is_active: bool

    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool
