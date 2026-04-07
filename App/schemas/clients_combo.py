from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ClientComboItem(BaseModel):
    id: UUID
    code: str
    name: str


class ClientComboSearchRequest(BaseModel):
    query: Optional[str] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=10)


class ClientComboSearchResponse(BaseModel):
    items: List[ClientComboItem]
    total: int
    page: int
    page_size: int
