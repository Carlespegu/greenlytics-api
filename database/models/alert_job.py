import uuid

from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func

from database.base import Base


class AlertJob(Base):
    __tablename__ = "alert_jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    alert_id = Column(UUID(as_uuid=True), nullable=False)
    reading_id = Column(UUID(as_uuid=True), nullable=False)
    plant_id = Column(UUID(as_uuid=True), nullable=True)

    status = Column(String(20), nullable=False, default="PENDING")
    attempts = Column(Integer, nullable=False, default=0)

    available_at = Column(DateTime, nullable=False, server_default=func.now())
    locked_at = Column(DateTime, nullable=True)
    processed_at = Column(DateTime, nullable=True)

    error_message = Column(Text, nullable=True)
    payload = Column(JSONB, nullable=True)

    created_at = Column(DateTime, nullable=False, server_default=func.now())
