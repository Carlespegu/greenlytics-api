from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from App.schemas.installations import InstallationResponse
from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, StringFilter, UUIDFilter


class InstallationSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    client_id: Optional[UUIDFilter] = None
    code: Optional[StringFilter] = None
    name: Optional[StringFilter] = None
    description: Optional[StringFilter] = None
    address: Optional[StringFilter] = None
    city: Optional[StringFilter] = None
    state: Optional[StringFilter] = None
    postal_code: Optional[StringFilter] = None
    country: Optional[StringFilter] = None
    is_active: Optional[BooleanFilter] = None


class InstallationSearchResponse(BaseModel):
    items: List[InstallationResponse]
    total: int
    page: int
    page_size: int
