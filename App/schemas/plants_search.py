from typing import List, Optional

from pydantic import BaseModel, Field

from App.schemas.plants import PlantResponse
from App.schemas.plants_enums import (
    LocationTypeEnum,
    PlantingTypeEnum,
    PlantStatusEnum,
    PlantTypeEnum,
    SunExposureEnum,
)
from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, StringFilter, UUIDFilter


class EnumStringFilter(BaseModel):
    filter_value: str
    comparator: str = "equals"


class PlantSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    client_id: Optional[UUIDFilter] = None
    installation_id: Optional[UUIDFilter] = None

    code: Optional[StringFilter] = None
    name: Optional[StringFilter] = None
    common_name: Optional[StringFilter] = None
    scientific_name: Optional[StringFilter] = None

    plant_type: Optional[EnumStringFilter] = None
    planting_type: Optional[EnumStringFilter] = None
    location_type: Optional[EnumStringFilter] = None
    sun_exposure: Optional[EnumStringFilter] = None

    status: Optional[EnumStringFilter] = None
    is_active: Optional[BooleanFilter] = None


class PlantSearchResponse(BaseModel):
    items: List[PlantResponse]
    total: int
    page: int
    page_size: int
