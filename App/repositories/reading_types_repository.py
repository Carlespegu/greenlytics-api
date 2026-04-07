from uuid import UUID

from sqlalchemy.orm import Session

from database.models.reading_type import ReadingType


def get_all_reading_types(db: Session):
    return (
        db.query(ReadingType)
        .filter(ReadingType.is_active == True)  # noqa: E712
        .order_by(ReadingType.name.asc())
        .all()
    )


def get_reading_type_by_id(db: Session, reading_type_id: UUID):
    return (
        db.query(ReadingType)
        .filter(ReadingType.id == reading_type_id, ReadingType.is_active == True)  # noqa: E712
        .first()
    )


def get_reading_type_by_code(db: Session, code: str):
    return (
        db.query(ReadingType)
        .filter(ReadingType.code == code, ReadingType.is_active == True)  # noqa: E712
        .first()
    )
