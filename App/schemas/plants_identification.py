from typing import Optional

from pydantic import BaseModel

from App.schemas.plants_enums import (
    LocationTypeEnum,
    PlantStatusEnum,
    PlantTypeEnum,
    SunExposureEnum,
)


class PlantIdentificationResponse(BaseModel):
    suggested_code: str
    name: str
    common_name: Optional[str] = None
    scientific_name: Optional[str] = None
    plant_type: Optional[PlantTypeEnum] = None
    location_type: Optional[LocationTypeEnum] = None
    sun_exposure: Optional[SunExposureEnum] = None
    status: Optional[PlantStatusEnum] = None
    notes: Optional[str] = None
    care_summary: Optional[str] = None
    current_state: Optional[str] = None
    confidence: Optional[float] = None
