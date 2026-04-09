from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from App.core.concurrency import ensure_record_is_current
from App.core.security import generate_api_key
from App.repositories.devices_repository import (
    create_device,
    get_all_devices,
    get_device_by_api_key,
    get_device_by_code,
    get_device_by_id,
    search_devices,
    update_device,
)
from App.repositories.device_types_repository import get_device_type_by_id
from App.schemas.devices import DeviceCreate, DeviceUpdate
from database.models.device import Device

ALLOWED_DEVICE_STATUSES = {"online", "offline", "warning", "error"}


def _normalize_device_status(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip().lower()
    if not normalized:
        return None

    if normalized not in ALLOWED_DEVICE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid device status",
        )

    return normalized


def _resolve_device_client_scope(current_user):
    if current_user is None:
        return None

    if (current_user.role_code or "").upper() == "ADMIN":
        return None

    return current_user.client_id


def _raise_device_uniqueness_error(exc: IntegrityError):
    message = str(exc.orig).lower() if getattr(exc, "orig", None) else str(exc).lower()

    if "devices_code_key" in message or "idx_devices_code_active_unique" in message or "key (code)=" in message:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device code already exists",
        ) from exc

    if "devices_apikey_key" in message or "idx_devices_apikey_active_unique" in message or "key (apikey)=" in message:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Device API key already exists",
        ) from exc

    raise exc


def list_devices_service(db: Session, current_user=None):
    return get_all_devices(db, client_id=_resolve_device_client_scope(current_user))


def search_devices_service(db: Session, payload, current_user=None):
    try:
        return search_devices(
            db,
            payload,
            client_id=_resolve_device_client_scope(current_user),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_device_service(db: Session, device_id, current_user=None):
    device = get_device_by_id(
        db,
        device_id,
        client_id=_resolve_device_client_scope(current_user),
    )
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )
    return device


def create_device_service(db: Session, payload: DeviceCreate, created_by: str | None = None):
    existing = get_device_by_code(db, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Device with code '{payload.code}' already exists",
        )

    device_type = get_device_type_by_id(db, payload.device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device type not found",
        )

    api_key = payload.api_key or generate_api_key()

    while get_device_by_api_key(db, api_key):
        api_key = generate_api_key()

    device = Device(
        device_type_id=payload.device_type_id,
        code=payload.code,
        name=payload.name,
        description=payload.description,
        serial_number=payload.serial_number,
        mac_address=payload.mac_address,
        firmware_version=payload.firmware_version,
        hardware_version=payload.hardware_version,
        api_key=api_key,
        wifi_name=payload.wifi_name,
        wifi_password=payload.wifi_password,
        status=_normalize_device_status(payload.status) or "offline",
        last_seen_on=payload.last_seen_on,
        is_active=payload.is_active,
        created_by=created_by or payload.created_by,
    )

    try:
        return create_device(db, device)
    except IntegrityError as exc:
        db.rollback()
        _raise_device_uniqueness_error(exc)


def update_device_service(db: Session, device_id, payload: DeviceUpdate, modified_by: str | None = None):
    device = get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    ensure_record_is_current(payload.modified_on, device.modified_on)

    if payload.code is not None and payload.code != device.code:
        existing = get_device_by_code(db, payload.code)
        if existing and existing.id != device.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Device with code '{payload.code}' already exists",
            )
        device.code = payload.code

    if payload.device_type_id is not None and payload.device_type_id != device.device_type_id:
        device_type = get_device_type_by_id(db, payload.device_type_id)
        if not device_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device type not found",
            )
        device.device_type_id = payload.device_type_id

    if payload.name is not None:
        device.name = payload.name
    if payload.description is not None:
        device.description = payload.description
    if payload.serial_number is not None:
        device.serial_number = payload.serial_number
    if payload.mac_address is not None:
        device.mac_address = payload.mac_address
    if payload.firmware_version is not None:
        device.firmware_version = payload.firmware_version
    if payload.hardware_version is not None:
        device.hardware_version = payload.hardware_version
    if payload.api_key is not None:
        if payload.api_key != device.api_key:
            existing_api = get_device_by_api_key(db, payload.api_key)
            if existing_api and existing_api.id != device.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Device api_key already exists",
                )
        device.api_key = payload.api_key
    if payload.wifi_name is not None:
        device.wifi_name = payload.wifi_name
    if payload.wifi_password is not None:
        device.wifi_password = payload.wifi_password
    if payload.status is not None:
        device.status = _normalize_device_status(payload.status)
    if payload.last_seen_on is not None:
        device.last_seen_on = payload.last_seen_on
    if payload.is_active is not None:
        device.is_active = payload.is_active
    if modified_by:
        device.modified_by = modified_by
    elif payload.modified_by is not None:
        device.modified_by = payload.modified_by

    device.modified_on = datetime.utcnow()

    try:
        return update_device(db, device)
    except IntegrityError as exc:
        db.rollback()
        _raise_device_uniqueness_error(exc)


def delete_device_service(db: Session, device_id, modified_by: str | None = None):
    device = get_device_by_id(db, device_id)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device not found",
        )

    device.is_deleted = True
    device.deleted_on = datetime.utcnow()
    device.modified_on = datetime.utcnow()
    if modified_by:
        device.modified_by = modified_by
    device.is_active = False

    return update_device(db, device)
