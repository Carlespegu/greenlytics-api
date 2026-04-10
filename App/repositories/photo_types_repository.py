from sqlalchemy.orm import Session

from database.models.photo_type import PhotoType


def get_photo_type_by_code(db: Session, code: str):
    return (
        db.query(PhotoType)
        .filter(PhotoType.code == code.strip().lower())
        .first()
    )
