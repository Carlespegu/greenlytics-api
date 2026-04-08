from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.plant_thresholds import (
    PlantHealthSummaryResponse,
    PlantThresholdCreate,
    PlantThresholdResponse,
    PlantThresholdSearchRequest,
    PlantThresholdSearchResponse,
    PlantThresholdUpdate,
)
from App.services.plant_thresholds_service import (
    create_plant_threshold_service,
    delete_plant_threshold_service,
    get_plant_health_summary_service,
    get_plant_threshold_service,
    list_plant_thresholds_service,
    search_plant_thresholds_service,
    update_plant_threshold_service,
)
from App.services.plants_service import get_plant_service
from database.session import get_db

router = APIRouter(prefix="/plant-thresholds", tags=["Plant thresholds"])


@router.get("", response_model=list[PlantThresholdResponse])
def list_plant_thresholds(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    return list_plant_thresholds_service(db, plant_id)


@router.post("/search", response_model=PlantThresholdSearchResponse)
def search_plant_thresholds(
    payload: PlantThresholdSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if payload.plant_id is not None:
        plant = get_plant_service(db, payload.plant_id.filter_value)
        ensure_client_scope(current_user, plant.client_id)
    return search_plant_thresholds_service(db, payload)


@router.get("/{threshold_id}", response_model=PlantThresholdResponse)
def get_plant_threshold(
    threshold_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    threshold = get_plant_threshold_service(db, threshold_id)
    plant = get_plant_service(db, threshold.plant_id)
    ensure_client_scope(current_user, plant.client_id)
    return threshold


@router.post("", response_model=PlantThresholdResponse, status_code=status.HTTP_201_CREATED)
def create_plant_threshold(
    payload: PlantThresholdCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    plant = get_plant_service(db, payload.plant_id)
    ensure_client_scope(current_user, plant.client_id)
    payload.created_by = current_user.username or current_user.email
    return create_plant_threshold_service(db, payload)


@router.put("/{threshold_id}", response_model=PlantThresholdResponse)
def update_plant_threshold(
    threshold_id: UUID,
    payload: PlantThresholdUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    threshold = get_plant_threshold_service(db, threshold_id)
    plant = get_plant_service(db, threshold.plant_id)
    ensure_client_scope(current_user, plant.client_id)
    payload.modified_by = current_user.username or current_user.email
    return update_plant_threshold_service(db, threshold_id, payload)


@router.delete("/{threshold_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant_threshold(
    threshold_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    threshold = get_plant_threshold_service(db, threshold_id)
    plant = get_plant_service(db, threshold.plant_id)
    ensure_client_scope(current_user, plant.client_id)
    delete_plant_threshold_service(db, threshold_id, current_user.username or current_user.email)
    return None


@router.get("/plant/{plant_id}/health-summary", response_model=PlantHealthSummaryResponse)
def get_plant_health_summary(
    plant_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    plant = get_plant_service(db, plant_id)
    ensure_client_scope(current_user, plant.client_id)
    return get_plant_health_summary_service(db, plant_id)
