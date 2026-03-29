from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.devices_repository import get_device_by_id
from App.repositories.installation_devices_repository import (
    create_installation_device,
    get_active_assignment_by_device_id,
    get_all_installation_devices,
    get_installation_device_by_id,
    search_installation_devices,
    update_installation_device,
)
from App.repositories.installations_repository import get_installation_by_id
from App.schemas.installation_devices import InstallationDeviceCreate, InstallationDeviceUpdate
from database.models.installation_device import InstallationDevice


def list_installation_devices_service(db: Session):
    return get_all_installation_devices(db)


def search_installation_devices_service(db: Session, payload):
    try:
        return search_installation_devices(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_installation_device_service(db: Session, installation_device_id: UUID):
    installation_device = get_installation_device_by_id(db, installation_device_id)
    if not installation_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="InstallationDevice not found",
        )
    return installation_device


def create_installation_device_service(db: Session, payload: InstallationDeviceCreate):
    installation = get_installation_by_id(db, payload.installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )

    device = get_device_by_id(db, payload.device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    if payload.is_active:
        active_assignment = get_active_assignment_by_device_id(db, payload.device_id)
        if active_assignment:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Device already has an active installation assignment",
            )

    installation_device = InstallationDevice(
        installation_id=payload.installation_id,
        device_id=payload.device_id,
        assigned_on=payload.assigned_on,
        unassigned_on=payload.unassigned_on,
        notes=payload.notes,
        is_active=payload.is_active,
        created_by=payload.created_by,
    )

    return create_installation_device(db, installation_device)


def update_installation_device_service(db: Session, installation_device_id: UUID, payload: InstallationDeviceUpdate):
    installation_device = get_installation_device_by_id(db, installation_device_id)
    if not installation_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="InstallationDevice not found",
        )

    new_installation_id = installation_device.installation_id if payload.installation_id is None else payload.installation_id
    new_device_id = installation_device.device_id if payload.device_id is None else payload.device_id
    new_is_active = installation_device.is_active if payload.is_active is None else payload.is_active

    if payload.installation_id is not None:
        installation = get_installation_by_id(db, payload.installation_id)
        if not installation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Installation not found",
            )

    if payload.device_id is not None:
        device = get_device_by_id(db, payload.device_id)
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found",
            )

    if new_is_active:
        active_assignment = get_active_assignment_by_device_id(db, new_device_id)
        if active_assignment and active_assignment.id != installation_device.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Device already has an active installation assignment",
            )

    installation_device.installation_id = new_installation_id
    installation_device.device_id = new_device_id

    if payload.assigned_on is not None:
        installation_device.assigned_on = payload.assigned_on
    if payload.unassigned_on is not None:
        installation_device.unassigned_on = payload.unassigned_on
    if payload.notes is not None:
        installation_device.notes = payload.notes
    if payload.is_active is not None:
        installation_device.is_active = payload.is_active
    if payload.modified_by is not None:
        installation_device.modified_by = payload.modified_by

    installation_device.modified_on = datetime.utcnow()

    return update_installation_device(db, installation_device)


def delete_installation_device_service(db: Session, installation_device_id: UUID):
    installation_device = get_installation_device_by_id(db, installation_device_id)
    if not installation_device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="InstallationDevice not found",
        )

    installation_device.is_active = False
    installation_device.unassigned_on = datetime.utcnow()
    installation_device.modified_on = datetime.utcnow()

    return update_installation_device(db, installation_device)
