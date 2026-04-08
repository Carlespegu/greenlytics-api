import uuid

from sqlalchemy import Boolean, Column, DateTime, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        default=uuid.uuid4,
    )

    client_id = Column("clientid", UUID(as_uuid=True), nullable=False)
    installation_id = Column("installationid", UUID(as_uuid=True), nullable=True)
    plant_id = Column("plantid", UUID(as_uuid=True), nullable=True)
    reading_type_id = Column("readingtypeid", UUID(as_uuid=True), nullable=False)

    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)

    channel = Column(String(30), nullable=False)
    recipient_email = Column("recipientemail", String(255), nullable=True)

    condition_type = Column("conditiontype", String(30), nullable=False)
    value_type = Column("valuetype", String(20), nullable=False)

    min_value = Column("minvalue", Numeric(18, 4), nullable=True)
    max_value = Column("maxvalue", Numeric(18, 4), nullable=True)
    exact_numeric_value = Column("exactnumericvalue", Numeric(18, 4), nullable=True)
    exact_text_value = Column("exacttextvalue", String(255), nullable=True)
    exact_boolean_value = Column("exactbooleanvalue", Boolean, nullable=True)

    is_active = Column("isactive", Boolean, nullable=False, default=True)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", String(100), nullable=True)
    modified_on = Column("modifiedon", DateTime, nullable=True)
    modified_by = Column("modifiedby", String(100), nullable=True)
    deleted_on = Column("deletedon", DateTime, nullable=True)
