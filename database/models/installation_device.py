import uuid
from sqlalchemy import Column, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class InstallationDevice(Base):
    __tablename__ = "installationdevices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    installation_id = Column("installationid", UUID(as_uuid=True), nullable=False)
    device_id = Column("deviceid", UUID(as_uuid=True), nullable=False)

    assigned_on = Column("assignedon", DateTime, nullable=False, server_default=func.now())
    unassigned_on = Column("unassignedon", DateTime)
    notes = Column(Text)
    is_active = Column("isactive", Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", Text)
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", Text)
