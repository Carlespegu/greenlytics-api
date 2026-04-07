from typing import List, Optional

from pydantic import BaseModel, Field

from App.schemas.clients import ClientResponse
from App.schemas.users_search import (
    BooleanFilter,
    PaginationParams,
    SortingParam,
    StringFilter,
    UUIDFilter,
)


class ClientSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    code: Optional[StringFilter] = None
    name: Optional[StringFilter] = None
    trade_name: Optional[StringFilter] = None
    tax_id: Optional[StringFilter] = None
    email: Optional[StringFilter] = None
    phone: Optional[StringFilter] = None
    city: Optional[StringFilter] = None
    country: Optional[StringFilter] = None
    client_type: Optional[StringFilter] = None
    is_active: Optional[BooleanFilter] = None
    client_id: Optional[UUIDFilter] = None


class ClientSearchResponse(BaseModel):
    items: List[ClientResponse]
    total: int
    page: int
    page_size: int
