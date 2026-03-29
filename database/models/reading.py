import uuid
from sqlalchemy import Column, String, DateTime, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Reading(Base):
    __tablename__ = "readings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    device_id = Column("deviceid", UUID(as_uuid=True), nullable=False)
    installation_id = Column("installationid", UUID(as_uuid=True))
    client_id = Column("clientid", UUID(as_uuid=True))
    plant_id = Column("plantid", UUID(as_uuid=True))

    ts = Column(DateTime, nullable=False, server_default=func.now())

    temp_c = Column("tempc", Numeric(10, 2))
    hum_air = Column("humair", Numeric(10, 2))
    ldr_raw = Column("ldrraw", Integer)
    soil_percent = Column("soilpercent", Integer)
    rain = Column(String(50))
    rssi = Column(Integer)

    created_on = Column("createdon", DateTime, nullable=False, server_default=func.now())
