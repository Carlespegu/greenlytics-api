from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.installations import InstallationCreate, InstallationResponse, InstallationUpdate
from App.schemas.installations_search import InstallationSearchRequest, InstallationSearchResponse
from App.services.installations_service import (
    create_installation_service,
    delete_installation_service,
    get_installation_service,
    list_installations_service,
    search_installations_service,
    update_installation_service,
)
from database.session import get_db

router = APIRouter(prefix="/installations", tags=["Installations"])


@router.get("", response_model=List[InstallationResponse])
def list_installations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    items = list_installations_service(db)
    if current_user.role_code.upper() == "ADMIN":
        return items
    return [item for item in items if item.client_id == current_user.client_id]


@router.post("/search", response_model=InstallationSearchResponse)
def search_installations(
    payload: InstallationSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role_code.upper() != "ADMIN":
        payload.client_id = {"filter_value": current_user.client_id, "comparator": "equals"}  # type: ignore
    return search_installations_service(db, payload)


@router.get("/{installation_id}", response_model=InstallationResponse)
def get_installation(
    installation_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    installation = get_installation_service(db, installation_id)
    ensure_client_scope(current_user, installation.client_id)
    return installation


@router.post("", response_model=InstallationResponse, status_code=status.HTTP_201_CREATED)
def create_installation(
    payload: InstallationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, payload.client_id)
    return create_installation_service(db, payload)


@router.put("/{installation_id}", response_model=InstallationResponse)
def update_installation(
    installation_id: UUID,
    payload: InstallationUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    installation = get_installation_service(db, installation_id)
    ensure_client_scope(current_user, installation.client_id)

    if payload.client_id is not None:
        ensure_client_scope(current_user, payload.client_id)

    return update_installation_service(db, installation_id, payload)


@router.delete("/{installation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_installation(
    installation_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    installation = get_installation_service(db, installation_id)
    ensure_client_scope(current_user, installation.client_id)
    delete_installation_service(db, installation_id)
    return None
