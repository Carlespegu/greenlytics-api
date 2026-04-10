import mimetypes
from datetime import datetime
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.photo_types_repository import get_photo_type_by_code
from App.repositories.photos_repository import (
    get_latest_photo_by_part,
    get_photo_by_id,
    list_photos_by_entity,
)
from App.schemas.photos import PhotoPartCode, PhotoResponse
from App.services.photo_storage_service import (
    create_signed_url,
    delete_file_from_storage,
    download_file_from_storage,
    upload_file_to_storage,
)
from database.models.photo import Photo


ALLOWED_PHOTO_PARTS = {"leaf", "trunk", "general", "evolution"}


def _validate_photo_part(photo_part: str) -> PhotoPartCode:
    normalized = (photo_part or "").strip().lower()
    if normalized not in ALLOWED_PHOTO_PARTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid photo_part",
        )
    return normalized  # type: ignore[return-value]


def _resolve_photo_type(db: Session, photo_type_code: str):
    photo_type = get_photo_type_by_code(db, photo_type_code)
    if not photo_type:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Photo type '{photo_type_code}' is not configured",
        )
    return photo_type


def _build_storage_path(*, photo_type_code: str, object_id: UUID, photo_part: str, filename: str | None):
    extension = mimetypes.guess_extension(mimetypes.guess_type(filename or "")[0] or "") or ""
    sanitized_extension = extension if extension in {".png", ".jpg", ".jpeg", ".webp"} else ""
    if not sanitized_extension and filename and "." in filename:
        sanitized_extension = f".{filename.rsplit('.', 1)[-1].lower()}"
    if sanitized_extension not in {".png", ".jpg", ".jpeg", ".webp"}:
        sanitized_extension = ".jpg"
    return (
        f"{photo_type_code}/{object_id}/{datetime.utcnow().strftime('%Y%m%dT%H%M%S')}-"
        f"{photo_part}-{uuid4().hex[:8]}{sanitized_extension}"
    )


def serialize_photo(photo, photo_type_code: str):
    return PhotoResponse(
        id=photo.id,
        photo_type_id=photo.photo_type_id,
        photo_type_code=photo_type_code,  # type: ignore[arg-type]
        id_object=photo.id_object,
        photo_part=photo.photo_part,  # type: ignore[arg-type]
        storage_path=photo.storage_path,
        signed_url=create_signed_url(photo.storage_path),
        mime_type=photo.mime_type,
        file_size=photo.file_size,
        captured_on=photo.captured_on,
        created_on=photo.created_on,
        created_by=photo.created_by,
        notes=photo.notes,
    )


def create_photo_record(
    db: Session,
    *,
    photo_type_code: str,
    object_id: UUID,
    photo_part: str,
    filename: str | None,
    content_type: str | None,
    content: bytes,
    created_by: str | None,
    notes: str | None = None,
    captured_on: datetime | None = None,
) -> Photo:
    photo_type = _resolve_photo_type(db, photo_type_code)
    resolved_part = _validate_photo_part(photo_part)
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Photo file is required")

    resolved_content_type = content_type or mimetypes.guess_type(filename or "")[0] or "image/jpeg"
    storage_path = _build_storage_path(
        photo_type_code=photo_type.code,
        object_id=object_id,
        photo_part=resolved_part,
        filename=filename,
    )
    upload_file_to_storage(storage_path=storage_path, content=content, content_type=resolved_content_type)

    photo = Photo(
        photo_type_id=photo_type.id,
        id_object=object_id,
        photo_part=resolved_part,
        storage_path=storage_path,
        mime_type=resolved_content_type,
        file_size=len(content),
        captured_on=captured_on or datetime.utcnow(),
        created_by=created_by,
        notes=notes,
    )
    db.add(photo)
    db.flush()
    return photo


def list_entity_photos_service(db: Session, *, photo_type_code: str, object_id: UUID):
    photo_type = _resolve_photo_type(db, photo_type_code)
    photos = list_photos_by_entity(db, photo_type.id, object_id)
    return [serialize_photo(photo, photo_type.code) for photo in photos]


def delete_entity_photo_service(db: Session, *, photo_type_code: str, object_id: UUID, photo_id: UUID):
    photo_type = _resolve_photo_type(db, photo_type_code)
    photo = get_photo_by_id(db, photo_id)
    if not photo or photo.photo_type_id != photo_type.id or photo.id_object != object_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    delete_file_from_storage(photo.storage_path)
    db.delete(photo)
    db.commit()
    return True


def get_latest_required_photos_for_entity(db: Session, *, photo_type_code: str, object_id: UUID):
    photo_type = _resolve_photo_type(db, photo_type_code)
    required = {}
    for part in ("leaf", "trunk", "general"):
        photo = get_latest_photo_by_part(db, photo_type.id, object_id, part)
        if not photo:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Missing required photo for part '{part}'",
            )
        required[part] = {
            "photo": photo,
            "bytes": download_file_from_storage(photo.storage_path),
        }
    return required
