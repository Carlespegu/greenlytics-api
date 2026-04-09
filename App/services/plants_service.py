from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.clients_repository import get_client_by_id
from App.repositories.installations_repository import get_installation_by_id
from App.repositories.plants_repository import (
    create_plant,
    get_all_plants,
    get_plant_by_client_and_code,
    get_plant_by_id,
    search_plants,
    update_plant,
)
from App.services.plant_thresholds_service import seed_default_thresholds_for_plant_service
from App.schemas.plants import PlantCreate, PlantUpdate
from database.models.plant import Plant


def list_plants_service(db: Session):
    return get_all_plants(db)


def search_plants_service(db: Session, payload):
    try:
        return search_plants(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_plant_service(db: Session, plant_id: UUID):
    plant = get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )
    return plant


def _validate_client_installation_consistency(db: Session, client_id: UUID, installation_id: UUID | None):
    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    if installation_id is None:
        return

    installation = get_installation_by_id(db, installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )

    if installation.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Installation does not belong to the provided client",
        )


def create_plant_service(db: Session, payload: PlantCreate):
    _validate_client_installation_consistency(db, payload.client_id, payload.installation_id)

    existing = get_plant_by_client_and_code(db, payload.client_id, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Plant with code '{payload.code}' already exists for this client",
        )

    plant = Plant(
        client_id=payload.client_id,
        installation_id=payload.installation_id,
        code=payload.code,
        name=payload.name,
        common_name=payload.common_name,
        scientific_name=payload.scientific_name,
        plant_type=payload.plant_type,
        planting_type=payload.planting_type,
        location_type=payload.location_type,
        sun_exposure=payload.sun_exposure,
        pot_size_cm=payload.pot_size_cm,
        height_cm=payload.height_cm,
        width_cm=payload.width_cm,
        planting_date=payload.planting_date,
        last_repotting_date=payload.last_repotting_date,
        status=payload.status,
        notes=payload.notes,
        is_active=payload.is_active,
        created_by=payload.created_by,
    )

    created_plant = create_plant(db, plant)
    seed_default_thresholds_for_plant_service(db, created_plant, payload.created_by)
    return created_plant


def update_plant_service(db: Session, plant_id: UUID, payload: PlantUpdate):
    plant = get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )

    new_client_id = plant.client_id if payload.client_id is None else payload.client_id
    fields_set = payload.model_fields_set
    new_installation_id = plant.installation_id if "installation_id" not in fields_set else payload.installation_id
    new_code = plant.code if payload.code is None else payload.code

    if (new_client_id != plant.client_id) or (new_installation_id != plant.installation_id):
        _validate_client_installation_consistency(db, new_client_id, new_installation_id)

    if (new_client_id != plant.client_id) or (new_code != plant.code):
        existing = get_plant_by_client_and_code(db, new_client_id, new_code)
        if existing and existing.id != plant.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Plant with code '{new_code}' already exists for this client",
            )

    plant.client_id = new_client_id
    plant.installation_id = new_installation_id

    if "code" in fields_set:
        plant.code = payload.code
    if "name" in fields_set:
        plant.name = payload.name
    if "common_name" in fields_set:
        plant.common_name = payload.common_name
    if "scientific_name" in fields_set:
        plant.scientific_name = payload.scientific_name
    if "plant_type" in fields_set:
        plant.plant_type = payload.plant_type
    if "planting_type" in fields_set:
        plant.planting_type = payload.planting_type
    if "location_type" in fields_set:
        plant.location_type = payload.location_type
    if "sun_exposure" in fields_set:
        plant.sun_exposure = payload.sun_exposure
    if "pot_size_cm" in fields_set:
        plant.pot_size_cm = payload.pot_size_cm
    if "height_cm" in fields_set:
        plant.height_cm = payload.height_cm
    if "width_cm" in fields_set:
        plant.width_cm = payload.width_cm
    if "planting_date" in fields_set:
        plant.planting_date = payload.planting_date
    if "last_repotting_date" in fields_set:
        plant.last_repotting_date = payload.last_repotting_date
    if "status" in fields_set:
        plant.status = payload.status
    if "notes" in fields_set:
        plant.notes = payload.notes
    if "is_active" in fields_set:
        plant.is_active = payload.is_active
    if payload.modified_by is not None:
        plant.modified_by = payload.modified_by

    plant.modified_on = datetime.utcnow()

    return update_plant(db, plant)


def delete_plant_service(db: Session, plant_id: UUID, deleted_by: str | None = None):
    plant = get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plant not found",
        )

    plant.is_deleted = True
    plant.deleted_on = datetime.utcnow()
    plant.modified_on = datetime.utcnow()
    plant.modified_by = deleted_by
    plant.is_active = False

    return update_plant(db, plant)
