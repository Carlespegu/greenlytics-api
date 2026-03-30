from sqlalchemy.orm import Session
from database.models.reading_type import ReadingType


def get_reading_type_by_code(db: Session, code: str):
    return (
        db.query(ReadingType)
        .filter(ReadingType.code == code, ReadingType.is_active == True)  # noqa: E712
        .first()
    )