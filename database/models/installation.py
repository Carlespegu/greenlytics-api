import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Installation(Base):
    __tablename__ = "installations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    client_id = Column("clientid", UUID(as_uuid=True), nullable=False)

    code = Column(String(50), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)

    address = Column(String(200))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column("postalcode", String(20))
    country = Column(String(100))

    latitude = Column(Numeric(9, 6))
    longitude = Column(Numeric(9, 6))

    is_active = Column("isactive", Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)
