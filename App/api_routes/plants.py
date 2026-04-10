from datetime import datetime
import json
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import ValidationError
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.plants import PlantCreate, PlantResponse, PlantUpdate
from App.schemas.plants_identification import PlantIdentificationResponse
from App.schemas.photos import PhotoResponse
from App.schemas.plants_search import PlantSearchRequest, PlantSearchResponse
from App.services.photos_service import (
    create_photo_record,
    delete_entity_photo_service,
    get_latest_required_photos_for_entity,
    list_entity_photos_service,
    serialize_photo,
)
from App.services.plant_identification_service import identify_plant_from_image, identify_plant_from_images
from App.services.plants_service import (
    create_plant_service,
    create_plant_with_photos_service,
    delete_plant_service,
    get_plant_service,
    list_plants_service,
    search_plants_service,
    update_plant_service,
)
from database.session import get_db

router = APIRouter(prefix="/plants", tags=["Plants"])


def _parse_plant_payload(raw_payload: str) -> PlantCreate:
    try:
        return PlantCreate.model_validate_json(raw_payload)
    except ValidationError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.errors()) from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid plant payload") from exc


def _parse_optional_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.strip()
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        return datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid captured_on value") from exc


@router.get("", response_model=List[PlantResponse])
def list_plants(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    items = list_plants_service(db)
    if current_user.role_code.upper() == "ADMIN":
        return items
    return [item for item in items if item.client_id == current_user.client_id]


@router.post("/search", response_model=PlantSearchResponse)
def search_plants(
    payload: PlantSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role_code.upper() != "ADMIN":
        payload.client_id = {"filter_value": current_user.client_id, "comparator": "equals"}  # type: ignore
    return search_plants_service(db, payload)


@router.post("", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
def create_plant(
    payload: PlantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, payload.client_id)
    payload.created_by = current_user.username or current_user.email
    return create_plant_service(db, payload)


@router.post("/with-photos", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
async def create_plant_with_photos(
    payload: str = Form(...),
    leaf_image: UploadFile = File(...),
    trunk_image: UploadFile = File(...),
    general_image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant_payload = _parse_plant_payload(payload)
    ensure_client_scope(current_user, plant_payload.client_id)
    plant_payload.created_by = current_user.username or current_user.email

    return create_plant_with_photos_service(
        db,
        payload=plant_payload,
        photos=[
            {
                "photo_part": "leaf",
                "filename": leaf_image.filename,
                "content_type": leaf_image.content_type,
                "content": await leaf_image.read(),
            },
            {
                "photo_part": "trunk",
                "filename": trunk_image.filename,
                "content_type": trunk_image.content_type,
                "content": await trunk_image.read(),
            },
            {
                "photo_part": "general",
                "filename": general_image.filename,
                "content_type": general_image.content_type,
                "content": await general_image.read(),
            },
        ],
    )


@router.post("/identify-from-photos", response_model=PlantIdentificationResponse)
async def identify_plant_from_photos(
    client_id: UUID | None = Form(None),
    installation_id: UUID | None = Form(None),
    language: str = Form("ca"),
    leaf_image: UploadFile = File(...),
    trunk_image: UploadFile = File(...),
    general_image: UploadFile = File(...),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    resolved_client_id = client_id

    if resolved_client_id is None and current_user.role_code.upper() != "ADMIN":
        resolved_client_id = current_user.client_id

    if resolved_client_id is not None:
        ensure_client_scope(current_user, resolved_client_id)

    return identify_plant_from_images(
        client_id=resolved_client_id,
        installation_id=installation_id,
        images={
            "leaf": {
                "filename": leaf_image.filename,
                "content_type": leaf_image.content_type,
                "image_bytes": await leaf_image.read(),
            },
            "trunk": {
                "filename": trunk_image.filename,
                "content_type": trunk_image.content_type,
                "image_bytes": await trunk_image.read(),
            },
            "general": {
                "filename": general_image.filename,
                "content_type": general_image.content_type,
                "image_bytes": await general_image.read(),
            },
        },
        language_code=language,
    )


@router.post("/identify-from-image", response_model=PlantIdentificationResponse)
async def identify_plant(
    client_id: UUID | None = Form(None),
    installation_id: UUID | None = Form(None),
    language: str = Form("ca"),
    image: UploadFile = File(...),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    resolved_client_id = client_id

    if resolved_client_id is None and current_user.role_code.upper() != "ADMIN":
        resolved_client_id = current_user.client_id

    if resolved_client_id is not None:
        ensure_client_scope(current_user, resolved_client_id)

    image_bytes = await image.read()
    return identify_plant_from_image(
        client_id=resolved_client_id,
        installation_id=installation_id,
        filename=image.filename,
        content_type=image.content_type,
        image_bytes=image_bytes,
        language_code=language,
    )


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    return plant


@router.get("/{plant_id}/photos", response_model=List[PhotoResponse])
def list_plant_photos(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    return list_entity_photos_service(db, photo_type_code="plant", object_id=plant_id)


@router.post("/{plant_id}/photos", response_model=PhotoResponse, status_code=status.HTTP_201_CREATED)
async def upload_plant_photo(
    plant_id: UUID,
    photo_part: str = Form(...),
    notes: str | None = Form(None),
    captured_on: str | None = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)

    photo = create_photo_record(
        db,
        photo_type_code="plant",
        object_id=plant_id,
        photo_part=photo_part,
        filename=image.filename,
        content_type=image.content_type,
        content=await image.read(),
        created_by=current_user.username or current_user.email,
        notes=notes,
        captured_on=_parse_optional_datetime(captured_on),
    )
    db.commit()
    db.refresh(photo)
    return serialize_photo(photo, "plant")


@router.delete("/{plant_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant_photo(
    plant_id: UUID,
    photo_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    delete_entity_photo_service(db, photo_type_code="plant", object_id=plant_id, photo_id=photo_id)
    return None


@router.post("/{plant_id}/photos/analyze-latest", response_model=PlantIdentificationResponse)
def analyze_latest_plant_photos(
    plant_id: UUID,
    language: str = Form("ca"),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    latest_photos = get_latest_required_photos_for_entity(db, photo_type_code="plant", object_id=plant_id)
    return identify_plant_from_images(
        client_id=plant.client_id,
        installation_id=plant.installation_id,
        images={
            part: {
                "filename": latest_photos[part]["photo"].storage_path,
                "content_type": latest_photos[part]["photo"].mime_type,
                "image_bytes": latest_photos[part]["bytes"],
            }
            for part in ("leaf", "trunk", "general")
        },
        language_code=language,
    )


@router.put("/{plant_id}", response_model=PlantResponse)
def update_plant(
    plant_id: UUID,
    payload: PlantUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)

    if payload.client_id is not None:
        ensure_client_scope(current_user, payload.client_id)

    payload.modified_by = current_user.username or current_user.email
    return update_plant_service(db, plant_id, payload)


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    delete_plant_service(db, plant_id, current_user.username or current_user.email)
    return None
