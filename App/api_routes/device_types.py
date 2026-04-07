from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from App.core.device_type_i18n import normalize_language
from App.dependencies.auth import require_roles
from App.schemas.device_types_combo import DeviceTypeComboSearchRequest, DeviceTypeComboSearchResponse
from App.schemas.device_types import DeviceTypeCreate, DeviceTypeResponse, DeviceTypeUpdate
from App.schemas.device_types_search import DeviceTypeSearchRequest, DeviceTypeSearchResponse
from App.services.device_types_service import (
    create_device_type_service,
    delete_device_type_service,
    get_device_type_service,
    list_device_types_service,
    search_device_type_combo_service,
    search_device_types_service,
    update_device_type_service,
)
from database.session import get_db

router = APIRouter(prefix="/device-types", tags=["Device Types"])


@router.get("", response_model=List[DeviceTypeResponse])
def list_device_types(
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    language = normalize_language(request.headers.get("Accept-Language"))
    return list_device_types_service(db, language=language)


@router.post("/search", response_model=DeviceTypeSearchResponse)
def search_device_types(
    payload: DeviceTypeSearchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    language = normalize_language(request.headers.get("Accept-Language"))
    return search_device_types_service(db, payload, language=language)


@router.post("/search-combo", response_model=DeviceTypeComboSearchResponse)
def search_device_types_combo(
    payload: DeviceTypeComboSearchRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    language = normalize_language(request.headers.get("Accept-Language"))
    return search_device_type_combo_service(db, payload, language=language)


@router.get("/{device_type_id}", response_model=DeviceTypeResponse)
def get_device_type(
    device_type_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    language = normalize_language(request.headers.get("Accept-Language"))
    return get_device_type_service(db, device_type_id, language=language)


@router.post("", response_model=DeviceTypeResponse, status_code=status.HTTP_201_CREATED)
def create_device_type(
    payload: DeviceTypeCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return create_device_type_service(db, payload)


@router.put("/{device_type_id}", response_model=DeviceTypeResponse)
def update_device_type(
    device_type_id: UUID,
    payload: DeviceTypeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return update_device_type_service(db, device_type_id, payload)


@router.delete("/{device_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device_type(
    device_type_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    delete_device_type_service(db, device_type_id)
    return None
