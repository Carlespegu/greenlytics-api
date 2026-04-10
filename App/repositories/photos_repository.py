from uuid import UUID

from sqlalchemy.orm import Session

from database.models.photo import Photo


def list_photos_by_entity(db: Session, photo_type_id: UUID, object_id: UUID):
    return (
        db.query(Photo)
        .filter(
            Photo.photo_type_id == photo_type_id,
            Photo.id_object == object_id,
        )
        .order_by(Photo.captured_on.desc(), Photo.created_on.desc())
        .all()
    )


def get_photo_by_id(db: Session, photo_id: UUID):
    return db.query(Photo).filter(Photo.id == photo_id).first()


def get_latest_photo_by_part(db: Session, photo_type_id: UUID, object_id: UUID, photo_part: str):
    return (
        db.query(Photo)
        .filter(
            Photo.photo_type_id == photo_type_id,
            Photo.id_object == object_id,
            Photo.photo_part == photo_part,
        )
        .order_by(Photo.captured_on.desc(), Photo.created_on.desc())
        .first()
    )
