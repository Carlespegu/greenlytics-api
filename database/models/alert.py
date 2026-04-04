from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from database.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        nullable=False,
        server_default=func.gen_random_uuid(),
    )

    client_id = Column(
        UUID(as_uuid=True),
        ForeignKey("clients.id"),
        nullable=False,
    )

    installation_id = Column(
        UUID(as_uuid=True),
        ForeignKey("installations.id"),
        nullable=True,
    )

    plant_id = Column(
        UUID(as_uuid=True),
        ForeignKey("plants.id"),
        nullable=True,
    )

    reading_type_id = Column(
        UUID(as_uuid=True),
        ForeignKey("reading_types.id"),
        nullable=False,
    )

    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)

    channel = Column(String(30), nullable=False)
    recipient_email = Column(String(255), nullable=True)

    condition_type = Column(String(30), nullable=False)
    value_type = Column(String(20), nullable=False)

    min_value = Column(Numeric(18, 4), nullable=True)
    max_value = Column(Numeric(18, 4), nullable=True)
    exact_numeric_value = Column(Numeric(18, 4), nullable=True)
    exact_text_value = Column(String(255), nullable=True)
    exact_boolean_value = Column(Boolean, nullable=True)

    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    is_deleted = Column(Boolean, nullable=False, default=False, server_default="false")

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
    )

    created_by = Column(
        UUID(as_uuid=True),
        nullable=True,
    )

    modified_at = Column(
        DateTime,
        nullable=True,
    )

    modified_by = Column(
        UUID(as_uuid=True),
        nullable=True,
    )
