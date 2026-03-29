import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    client_id = Column("clientid", UUID(as_uuid=True), ForeignKey("clients.id"), nullable=False)
    role_id = Column("roleid", UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)

    username = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False)
    password_hash = Column("passwordhash", String(255), nullable=False)

    first_name = Column("firstname", String(100))
    last_name = Column("lastname", String(100))

    is_active = Column("isactive", Boolean, nullable=False, default=True)
    last_login_on = Column("lastloginon", DateTime)

    created_on = Column("createdon", DateTime, server_default=func.now())
    created_by = Column("createdby", String(100))
    modified_on = Column("modifiedon", DateTime)
    modified_by = Column("modifiedby", String(100))
    deleted_on = Column("deletedon", DateTime)
    is_deleted = Column("isdeleted", Boolean, nullable=False, default=False)