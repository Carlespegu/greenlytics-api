from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.core.concurrency import ensure_record_is_current
from App.dependencies.auth import CurrentUserContext
from App.repositories.clients_repository import get_client_by_id
from App.repositories.devices_repository import get_device_by_id
from App.repositories.installation_devices_repository import (
    create_installation_device,
    get_active_assignments_by_installation_id,
    get_active_assignment_by_device_id,
    get_all_installation_devices,
    get_installation_device_by_id,
    search_installation_devices,
    update_installation_device,
)
from App.repositories.installations_repository import get_installation_by_id
from App.schemas.installation_device_assignments import InstallationDeviceAssignmentsSyncRequest
from App.schemas.installations import InstallationUpdate
from App.services.installations_service import update_installation_service
from App.schemas.installation_devices import InstallationDeviceCreate, InstallationDeviceUpdate
from database.models.installation_device import InstallationDevice


def _resolve_assignment_snapshot(installation, assignments):
    timestamps = []
    for candidate in (
        getattr(installation, "modified_on", None),
        getattr(installation, "created_on", None),
    ):
        if candidate is not None:
            timestamps.append(candidate)

    for assignment in assignments:
        for candidate in (
            getattr(assignment, "modified_on", None),
            getattr(assignment, "created_on", None),
            getattr(assignment, "assigned_on", None),
            getattr(assignment, "unassigned_on", None),
        ):
            if candidate is not None:
                timestamps.append(candidate)

    return max(timestamps) if timestamps else None


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

    ensure_record_is_current(payload.modified_on, installation_device.modified_on)

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


def get_installation_device_assignments_summary_service(db: Session, installation_id: UUID):
    installation = get_installation_by_id(db, installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )

    client = get_client_by_id(db, installation.client_id)
    active_assignments = get_active_assignments_by_installation_id(db, installation_id)
    notes_values = {
        (assignment.notes or "").strip()
        for assignment in active_assignments
        if (assignment.notes or "").strip()
    }
    modified_on = _resolve_assignment_snapshot(installation, active_assignments)

    return {
        "installation_id": installation.id,
        "installation_name": installation.name,
        "client_id": installation.client_id,
        "client_name": client.name if client else None,
        "notes": next(iter(notes_values)) if len(notes_values) == 1 else None,
        "modified_on": modified_on,
        "selected_device_ids": [assignment.device_id for assignment in active_assignments],
    }


def sync_installation_device_assignments_service(
    db: Session,
    installation_id: UUID,
    payload: InstallationDeviceAssignmentsSyncRequest,
    current_user: CurrentUserContext,
):
    installation = get_installation_by_id(db, installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )

    target_client_id = payload.client_id or installation.client_id
    client = get_client_by_id(db, target_client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    if (
        current_user.role_code.upper() != "ADMIN"
        and target_client_id != installation.client_id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to change installation client",
        )

    if target_client_id != installation.client_id:
        update_installation_service(
            db,
            installation_id,
            InstallationUpdate(client_id=target_client_id),
            modified_by=current_user.username,
        )
        installation = get_installation_by_id(db, installation_id)

    now = datetime.utcnow()
    requested_ids = []
    seen_ids = set()
    for device_id in payload.device_ids:
        key = str(device_id)
        if key in seen_ids:
            continue
        seen_ids.add(key)
        requested_ids.append(device_id)

    current_assignments = get_active_assignments_by_installation_id(db, installation_id)
    current_snapshot = _resolve_assignment_snapshot(installation, current_assignments)
    ensure_record_is_current(payload.modified_on, current_snapshot)
    current_by_device_id = {
        str(assignment.device_id): assignment
        for assignment in current_assignments
    }

    for assignment in current_assignments:
        if str(assignment.device_id) in seen_ids:
            continue

        assignment.is_active = False
        assignment.unassigned_on = now
        assignment.modified_on = now
        assignment.modified_by = current_user.username
        update_installation_device(db, assignment)

    normalized_notes = (payload.notes or "").strip() or None

    for device_id in requested_ids:
        device = get_device_by_id(db, device_id)
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Device not found: {device_id}",
            )

        existing_current_assignment = current_by_device_id.get(str(device_id))
        if existing_current_assignment:
            existing_current_assignment.notes = normalized_notes
            existing_current_assignment.modified_on = now
            existing_current_assignment.modified_by = current_user.username
            update_installation_device(db, existing_current_assignment)
            continue

        active_assignment = get_active_assignment_by_device_id(db, device_id)
        if active_assignment and active_assignment.installation_id != installation_id:
            source_installation = get_installation_by_id(db, active_assignment.installation_id)
            if not source_installation or source_installation.client_id != target_client_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Device is not assigned to the selected client",
                )

            active_assignment.is_active = False
            active_assignment.unassigned_on = now
            active_assignment.modified_on = now
            active_assignment.modified_by = current_user.username
            update_installation_device(db, active_assignment)

        elif active_assignment and active_assignment.installation_id == installation_id:
            active_assignment.notes = normalized_notes
            active_assignment.modified_on = now
            active_assignment.modified_by = current_user.username
            update_installation_device(db, active_assignment)
            continue
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Device is not currently assigned to the selected client",
            )

        create_installation_device(
            db,
            InstallationDevice(
                installation_id=installation_id,
                device_id=device_id,
                assigned_on=now,
                notes=normalized_notes,
                is_active=True,
                created_by=current_user.username,
            ),
        )

    return {
        "installation_id": installation_id,
        "client_id": target_client_id,
        "assigned_count": len(requested_ids),
        "modified_on": _resolve_assignment_snapshot(
            installation,
            get_active_assignments_by_installation_id(db, installation_id),
        ),
        "selected_device_ids": requested_ids,
    }
