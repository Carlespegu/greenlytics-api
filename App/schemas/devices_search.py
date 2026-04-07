from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from App.schemas.devices import DeviceResponse
from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, StringFilter, UUIDFilter


class DeviceSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    device_type_id: Optional[UUIDFilter] = None
    device_type_ids: Optional[List[UUID]] = None
    code: Optional[StringFilter] = None
    name: Optional[StringFilter] = None
    description: Optional[StringFilter] = None
    serial_number: Optional[StringFilter] = None
    mac_address: Optional[StringFilter] = None
    firmware_version: Optional[StringFilter] = None
    hardware_version: Optional[StringFilter] = None
    wifi_name: Optional[StringFilter] = None
    status: Optional[StringFilter] = None
    is_active: Optional[BooleanFilter] = None
    client_ids: Optional[List[UUID]] = None


class DeviceSearchResponse(BaseModel):
    items: List[DeviceResponse]
    total: int
    page: int
    page_size: int
