from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.dependencies.auth import require_roles
from App.schemas.installation_devices import (
    InstallationDeviceCreate,
    InstallationDeviceResponse,
    InstallationDeviceUpdate,
)
from App.schemas.installation_devices_search import (
    InstallationDeviceSearchRequest,
    InstallationDeviceSearchResponse,
)
from App.services.installation_devices_service import (
    create_installation_device_service,
    delete_installation_device_service,
    get_installation_device_service,
    list_installation_devices_service,
    search_installation_devices_service,
    update_installation_device_service,
)
from database.session import get_db

router = APIRouter(prefix="/installation-devices", tags=["Installation Devices"])


@router.get("", response_model=List[InstallationDeviceResponse])
def list_installation_devices(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return list_installation_devices_service(db)


@router.post("/search", response_model=InstallationDeviceSearchResponse)
def search_installation_devices(
    payload: InstallationDeviceSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return search_installation_devices_service(db, payload)


@router.get("/{installation_device_id}", response_model=InstallationDeviceResponse)
def get_installation_device(
    installation_device_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return get_installation_device_service(db, installation_device_id)


@router.post("", response_model=InstallationDeviceResponse, status_code=status.HTTP_201_CREATED)
def create_installation_device(
    payload: InstallationDeviceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return create_installation_device_service(db, payload)


@router.put("/{installation_device_id}", response_model=InstallationDeviceResponse)
def update_installation_device(
    installation_device_id: UUID,
    payload: InstallationDeviceUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return update_installation_device_service(db, installation_device_id, payload)


@router.delete("/{installation_device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_installation_device(
    installation_device_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    delete_installation_device_service(db, installation_device_id)
    return None
