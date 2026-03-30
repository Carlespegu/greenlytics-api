import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class ReadingType(Base):
    __tablename__ = "reading_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    unit = Column(String(30))
    value_type = Column(String(20), nullable=False)  # decimal | integer | string | boolean

    is_active = Column(Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    modified_on = Column("modifiedon", DateTime)