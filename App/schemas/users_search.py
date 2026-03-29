from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from App.schemas.users import UserResponse


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=200)


class SortingParam(BaseModel):
    sort_by: str
    sort_direction: str = "asc"


class StringFilter(BaseModel):
    filter_value: str
    comparator: str = "contains"


class BooleanFilter(BaseModel):
    filter_value: bool
    comparator: str = "equals"


class UUIDFilter(BaseModel):
    filter_value: UUID
    comparator: str = "equals"


class UserSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    username: Optional[StringFilter] = None
    email: Optional[StringFilter] = None
    first_name: Optional[StringFilter] = None
    last_name: Optional[StringFilter] = None
    is_active: Optional[BooleanFilter] = None
    client_id: Optional[UUIDFilter] = None
    role_id: Optional[UUIDFilter] = None


class UserSearchResponse(BaseModel):
    items: List[UserResponse]
    total: int
    page: int
    page_size: int