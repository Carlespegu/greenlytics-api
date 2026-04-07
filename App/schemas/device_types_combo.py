from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class DeviceTypeComboItem(BaseModel):
    id: UUID
    code: str
    name: str


class DeviceTypeComboSearchRequest(BaseModel):
    query: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=10)


class DeviceTypeComboSearchResponse(BaseModel):
    items: List[DeviceTypeComboItem]
    total: int
    page: int
    page_size: int
