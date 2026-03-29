import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text, Date, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Plant(Base):
    __tablename__ = "plants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    client_id = Column("clientid", UUID(as_uuid=True), nullable=False)
    installation_id = Column("installationid", UUID(as_uuid=True), nullable=False)

    code = Column(String(50), nullable=False)
    name = Column(String(150), nullable=False)

    common_name = Column("commonname", String(150))
    scientific_name = Column("scientificname", String(200))

    plant_type = Column("planttype", String(50))
    planting_type = Column("plantingtype", String(50))
    location_type = Column("locationtype", String(50))
    sun_exposure = Column("sunexposure", String(50))

    pot_size_cm = Column("potsizecm", Numeric(10, 2))
    height_cm = Column("heightcm", Numeric(10, 2))
    width_cm = Column("widthcm", Numeric(10, 2))

    planting_date = Column("plantingdate", Date)
    last_repotting_date = Column("lastrepottingdate", Date)

    status = Column(String(50))
    notes = Column(Text)

    is_active = Column("isactive", Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)
