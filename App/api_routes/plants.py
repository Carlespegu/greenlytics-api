from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.plants import PlantCreate, PlantResponse, PlantUpdate
from App.schemas.plants_search import PlantSearchRequest, PlantSearchResponse
from App.services.plants_service import (
    create_plant_service,
    delete_plant_service,
    get_plant_service,
    list_plants_service,
    search_plants_service,
    update_plant_service,
)
from database.session import get_db

router = APIRouter(prefix="/plants", tags=["Plants"])


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


@router.get("/{plant_id}", response_model=PlantResponse)
def get_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    return plant


@router.post("", response_model=PlantResponse, status_code=status.HTTP_201_CREATED)
def create_plant(
    payload: PlantCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, payload.client_id)
    return create_plant_service(db, payload)


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

    return update_plant_service(db, plant_id, payload)


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    delete_plant_service(db, plant_id)
    return None
