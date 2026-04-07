from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReadingTypeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    unit: Optional[str] = None
    value_type: str
    is_active: bool
    created_on: Optional[datetime] = None
    modified_on: Optional[datetime] = None
