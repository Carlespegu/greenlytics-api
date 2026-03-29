import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    code = Column(String(50), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    trade_name = Column("tradename", String(150))
    tax_id = Column("taxid", String(50))

    email = Column(String(150))
    phone = Column(String(50))
    website = Column(String(200))

    address = Column(String(200))
    city = Column(String(100))
    state = Column(String(100))
    postal_code = Column("postalcode", String(20))
    country = Column(String(100))

    is_active = Column("isactive", Boolean, nullable=False, default=True)
    client_type = Column("clienttype", String(50))
    notes = Column(Text)

    external_id = Column("externalid", String(100))
    api_key = Column("apikey", String(200), unique=True)
    api_secret_hash = Column("apisecrethash", String(255))

    created_on = Column("createdon", DateTime, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)