import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    device_type_id = Column("devicetypeid", UUID(as_uuid=True), nullable=False)

    code = Column(String(50), nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)

    serial_number = Column("serialnumber", String(100))
    mac_address = Column("macaddress", String(100))

    firmware_version = Column("firmwareversion", String(50))
    hardware_version = Column("hardwareversion", String(50))

    api_key = Column("apikey", String(200))

    wifi_name = Column("wifiname", String(100))
    wifi_password = Column("wifipassword", String(255))

    status = Column(String(50))
    last_seen_on = Column("lastseenon", DateTime)

    is_active = Column("isactive", Boolean, nullable=False, default=True)

    created_on = Column("createdon", DateTime, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)
