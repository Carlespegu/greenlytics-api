import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    photo_type_id = Column("phototypeid", UUID(as_uuid=True), ForeignKey("photo_types.id"), nullable=False)
    id_object = Column("idobject", UUID(as_uuid=True), nullable=False)
    photo_part = Column("photopart", String(30), nullable=False)
    storage_path = Column("storagepath", Text, nullable=False)
    mime_type = Column("mimetype", String(100), nullable=False)
    file_size = Column("filesize", Integer, nullable=False)
    captured_on = Column("capturedon", DateTime, nullable=False, server_default=func.now())
    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", Text)
    notes = Column(Text)
