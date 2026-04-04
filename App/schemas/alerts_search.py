from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, StringFilter, UUIDFilter


class DecimalFilter(BaseModel):
    filter_value: Decimal
    comparator: str = "equals"


class AlertSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    client_id: Optional[UUIDFilter] = None
    installation_id: Optional[UUIDFilter] = None
    plant_id: Optional[UUIDFilter] = None
    reading_type_id: Optional[UUIDFilter] = None

    name: Optional[StringFilter] = None
    channel: Optional[StringFilter] = None
    recipient_email: Optional[StringFilter] = None
    condition_type: Optional[StringFilter] = None
    is_active: Optional[BooleanFilter] = None

    client_name: Optional[StringFilter] = None
    installation_name: Optional[StringFilter] = None
    plant_name: Optional[StringFilter] = None
    reading_type_name: Optional[StringFilter] = None


class AlertSearchItem(BaseModel):
    id: UUID
    client_id: UUID
    client_code: Optional[str] = None
    client_name: Optional[str] = None

    installation_id: Optional[UUID] = None
    installation_code: Optional[str] = None
    installation_name: Optional[str] = None

    plant_id: Optional[UUID] = None
    plant_code: Optional[str] = None
    plant_name: Optional[str] = None

    reading_type_id: UUID
    reading_type_code: Optional[str] = None
    reading_type_name: Optional[str] = None
    reading_type_value_type: Optional[str] = None

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


class AlertSearchResponse(BaseModel):
    items: List[AlertSearchItem]
    total: int
    page: int
    page_size: int
