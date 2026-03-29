from typing import List, Optional

from pydantic import BaseModel, Field

from App.schemas.device_types import DeviceTypeResponse
from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, StringFilter


class DeviceTypeSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    code: Optional[StringFilter] = None
    name: Optional[StringFilter] = None
    description: Optional[StringFilter] = None
    is_active: Optional[BooleanFilter] = None


class DeviceTypeSearchResponse(BaseModel):
    items: List[DeviceTypeResponse]
    total: int
    page: int
    page_size: int
