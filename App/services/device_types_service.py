from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.device_types_repository import (
    create_device_type,
    get_all_device_types,
    get_device_type_by_code,
    get_device_type_by_id,
    search_device_types,
    update_device_type,
)
from App.schemas.device_types import DeviceTypeCreate, DeviceTypeUpdate
from database.models.device_type import DeviceType


def list_device_types_service(db: Session):
    return get_all_device_types(db)


def search_device_types_service(db: Session, payload):
    try:
        return search_device_types(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_device_type_service(db: Session, device_type_id: UUID):
    device_type = get_device_type_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device type not found",
        )
    return device_type


def create_device_type_service(db: Session, payload: DeviceTypeCreate):
    existing = get_device_type_by_code(db, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Device type with code '{payload.code}' already exists",
        )

    device_type = DeviceType(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
    )

    return create_device_type(db, device_type)


def update_device_type_service(db: Session, device_type_id: UUID, payload: DeviceTypeUpdate):
    device_type = get_device_type_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device type not found",
        )

    if payload.code is not None and payload.code != device_type.code:
        existing = get_device_type_by_code(db, payload.code)
        if existing and existing.id != device_type.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Device type with code '{payload.code}' already exists",
            )
        device_type.code = payload.code

    if payload.name is not None:
        device_type.name = payload.name
    if payload.description is not None:
        device_type.description = payload.description
    if payload.is_active is not None:
        device_type.is_active = payload.is_active

    device_type.modified_on = datetime.utcnow()

    return update_device_type(db, device_type)


def delete_device_type_service(db: Session, device_type_id: UUID):
    device_type = get_device_type_by_id(db, device_type_id)
    if not device_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device type not found",
        )

    device_type.is_deleted = True
    device_type.deleted_on = datetime.utcnow()
    device_type.modified_on = datetime.utcnow()
    device_type.is_active = False

    return update_device_type(db, device_type)
