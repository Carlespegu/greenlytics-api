from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from App.schemas.users_search import BooleanFilter, PaginationParams, SortingParam, UUIDFilter


class NumericFilter(BaseModel):
    filter_value: Decimal
    comparator: str = "equals"


class PlantThresholdCreate(BaseModel):
    plant_id: UUID
    reading_type_id: UUID
    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    optimal_min_value: Optional[Decimal] = None
    optimal_max_value: Optional[Decimal] = None
    unit: Optional[str] = None
    severity_below: Optional[str] = None
    severity_above: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    is_active: bool = True
    created_by: Optional[str] = None


class PlantThresholdUpdate(BaseModel):
    reading_type_id: Optional[UUID] = None
    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    optimal_min_value: Optional[Decimal] = None
    optimal_max_value: Optional[Decimal] = None
    unit: Optional[str] = None
    severity_below: Optional[str] = None
    severity_above: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    is_active: Optional[bool] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None


class PlantThresholdResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plant_id: UUID
    reading_type_id: UUID
    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    optimal_min_value: Optional[Decimal] = None
    optimal_max_value: Optional[Decimal] = None
    unit: Optional[str] = None
    severity_below: Optional[str] = None
    severity_above: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    is_active: bool
    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool


class PlantThresholdSearchRequest(BaseModel):
    pagination_params: PaginationParams = Field(default_factory=PaginationParams)
    sorting_params: List[SortingParam] = Field(default_factory=list)

    plant_id: Optional[UUIDFilter] = None
    reading_type_id: Optional[UUIDFilter] = None
    is_active: Optional[BooleanFilter] = None
    min_value: Optional[NumericFilter] = None
    max_value: Optional[NumericFilter] = None


class PlantThresholdSearchItem(PlantThresholdResponse):
    reading_type_code: Optional[str] = None
    reading_type_name: Optional[str] = None
    reading_type_unit: Optional[str] = None


class PlantThresholdSearchResponse(BaseModel):
    items: List[PlantThresholdSearchItem]
    total: int
    page: int
    page_size: int


class PlantHealthMetricResponse(BaseModel):
    reading_type_id: UUID
    reading_type_code: str
    reading_type_name: str
    unit: Optional[str] = None
    threshold_id: UUID
    latest_reading_id: Optional[UUID] = None
    latest_reading_at: Optional[datetime] = None
    latest_value: Optional[Decimal] = None
    min_value: Optional[Decimal] = None
    max_value: Optional[Decimal] = None
    optimal_min_value: Optional[Decimal] = None
    optimal_max_value: Optional[Decimal] = None
    status: str
    message: Optional[str] = None


class PlantHealthSummaryResponse(BaseModel):
    plant_id: UUID
    plant_name: str
    overall_status: str
    metrics: List[PlantHealthMetricResponse]
