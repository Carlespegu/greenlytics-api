import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)

    is_active = Column("isactive", Boolean, default=True)

    created_on = Column("createdon", DateTime, server_default=func.now())
    modified_on = Column("modifiedon", DateTime)
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, default=False)