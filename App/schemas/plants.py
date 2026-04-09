from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from App.schemas.plants_enums import (
    LocationTypeEnum,
    PlantingTypeEnum,
    PlantStatusEnum,
    PlantTypeEnum,
    SunExposureEnum,
)


class PlantCreate(BaseModel):
    client_id: UUID
    installation_id: Optional[UUID] = None

    code: str
    name: str

    common_name: Optional[str] = None
    scientific_name: Optional[str] = None

    plant_type: Optional[PlantTypeEnum] = None
    planting_type: Optional[PlantingTypeEnum] = None
    location_type: Optional[LocationTypeEnum] = None
    sun_exposure: Optional[SunExposureEnum] = None

    pot_size_cm: Optional[Decimal] = None
    height_cm: Optional[Decimal] = None
    width_cm: Optional[Decimal] = None

    planting_date: Optional[date] = None
    last_repotting_date: Optional[date] = None

    status: Optional[PlantStatusEnum] = None
    notes: Optional[str] = None

    is_active: bool = True
    created_by: Optional[str] = None


class PlantUpdate(BaseModel):
    client_id: Optional[UUID] = None
    installation_id: Optional[UUID] = None

    code: Optional[str] = None
    name: Optional[str] = None

    common_name: Optional[str] = None
    scientific_name: Optional[str] = None

    plant_type: Optional[PlantTypeEnum] = None
    planting_type: Optional[PlantingTypeEnum] = None
    location_type: Optional[LocationTypeEnum] = None
    sun_exposure: Optional[SunExposureEnum] = None

    pot_size_cm: Optional[Decimal] = None
    height_cm: Optional[Decimal] = None
    width_cm: Optional[Decimal] = None

    planting_date: Optional[date] = None
    last_repotting_date: Optional[date] = None

    status: Optional[PlantStatusEnum] = None
    notes: Optional[str] = None

    is_active: Optional[bool] = None
    modified_by: Optional[str] = None


class PlantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    installation_id: Optional[UUID] = None

    code: str
    name: str

    common_name: Optional[str] = None
    scientific_name: Optional[str] = None

    plant_type: Optional[PlantTypeEnum] = None
    planting_type: Optional[PlantingTypeEnum] = None
    location_type: Optional[LocationTypeEnum] = None
    sun_exposure: Optional[SunExposureEnum] = None

    pot_size_cm: Optional[Decimal] = None
    height_cm: Optional[Decimal] = None
    width_cm: Optional[Decimal] = None

    planting_date: Optional[date] = None
    last_repotting_date: Optional[date] = None

    status: Optional[PlantStatusEnum] = None
    notes: Optional[str] = None

    is_active: bool

    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool
