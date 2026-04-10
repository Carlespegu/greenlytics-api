import uuid

from sqlalchemy import Column, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class PhotoType(Base):
    __tablename__ = "photo_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", Text)
