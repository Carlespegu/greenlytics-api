import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class PlantThreshold(Base):
    __tablename__ = "plant_thresholds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    plant_id = Column("plantid", UUID(as_uuid=True), ForeignKey("plants.id"), nullable=False)
    reading_type_id = Column("readingtypeid", UUID(as_uuid=True), ForeignKey("reading_types.id"), nullable=False)

    min_value = Column("minvalue", Numeric(12, 2))
    max_value = Column("maxvalue", Numeric(12, 2))
    optimal_min_value = Column("optimalminvalue", Numeric(12, 2))
    optimal_max_value = Column("optimalmaxvalue", Numeric(12, 2))

    unit = Column(String(30))
    severity_below = Column("severitybelow", String(20))
    severity_above = Column("severityabove", String(20))
    notes = Column(Text)
    source = Column(String(30))

    is_active = Column("isactive", Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)
