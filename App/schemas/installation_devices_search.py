from typing import List, Optional

from pydantic import BaseModel, Field

from App.schemas.installation_devices import InstallationDeviceResponse
from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, UUIDFilter


class InstallationDeviceSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    installation_id: Optional[UUIDFilter] = None
    device_id: Optional[UUIDFilter] = None
    is_active: Optional[BooleanFilter] = None


class InstallationDeviceSearchResponse(BaseModel):
    items: List[InstallationDeviceResponse]
    total: int
    page: int
    page_size: int
