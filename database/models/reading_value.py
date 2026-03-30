import uuid
from sqlalchemy import Column, Integer, Numeric, Text, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database.base import Base


class ReadingValue(Base):
    __tablename__ = "reading_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    reading_id = Column(UUID(as_uuid=True), ForeignKey("readings.id", ondelete="CASCADE"), nullable=False)
    reading_type_id = Column(UUID(as_uuid=True), ForeignKey("reading_types.id"), nullable=False)

    value_decimal = Column(Numeric(12, 2))
    value_integer = Column(Integer)
    value_text = Column(Text)
    value_boolean = Column(Boolean)

    reading = relationship("Reading", back_populates="values")
    reading_type = relationship("ReadingType")