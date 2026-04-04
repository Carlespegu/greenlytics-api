import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    client_id = Column("clientid", UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    installation_id = Column("installationid", UUID(as_uuid=True), ForeignKey("installations.id"), nullable=True)
    plant_id = Column("plantid", UUID(as_uuid=True), ForeignKey("plants.id"), nullable=True)
    reading_type_id = Column("readingtypeid", UUID(as_uuid=True), ForeignKey("reading_types.id"), nullable=False)

    name = Column(String(150), nullable=False)
    description = Column(Text)

    channel = Column(String(30), nullable=False)
    recipient_email = Column("recipientemail", String(255))

    condition_type = Column("conditiontype", String(30), nullable=False)

    min_value = Column("minvalue", Numeric(12, 2))
    max_value = Column("maxvalue", Numeric(12, 2))
    exact_numeric_value = Column("exactnumericvalue", Numeric(12, 2))
    exact_text_value = Column("exacttextvalue", Text)
    exact_boolean_value = Column("exactbooleanvalue", Boolean)

    is_active = Column("isactive", Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)
