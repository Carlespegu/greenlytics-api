from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


PhotoEntityCode = Literal["plant", "device", "installation"]
PhotoPartCode = Literal["leaf", "trunk", "general", "evolution"]


class PhotoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    photo_type_id: UUID
    photo_type_code: PhotoEntityCode
    id_object: UUID
    photo_part: PhotoPartCode
    storage_path: str
    signed_url: Optional[str] = None
    mime_type: str
    file_size: int
    captured_on: datetime
    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    notes: Optional[str] = None


class PhotoUploadResponse(PhotoResponse):
    pass
