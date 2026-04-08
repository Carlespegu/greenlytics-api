from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.clients_repository import get_client_by_id
from App.repositories.installations_repository import (
    create_installation,
    get_all_installations,
    get_installation_by_client_and_code,
    get_installation_by_id,
    search_installations,
    update_installation,
)
from App.schemas.installations import InstallationCreate, InstallationUpdate
from database.models.installation import Installation


def list_installations_service(db: Session):
    return get_all_installations(db)


def search_installations_service(db: Session, payload):
    try:
        return search_installations(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_installation_service(db: Session, installation_id: UUID):
    installation = get_installation_by_id(db, installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )
    return installation


def create_installation_service(db: Session, payload: InstallationCreate, created_by: str | None = None):
    client = get_client_by_id(db, payload.client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    safe_code = payload.code.strip()
    safe_name = payload.name.strip()

    if not safe_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'code' is required",
        )

    if not safe_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'name' is required",
        )

    existing = get_installation_by_client_and_code(db, payload.client_id, safe_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Installation with code '{safe_code}' already exists for this client",
        )

    installation = Installation(
        client_id=payload.client_id,
        code=safe_code,
        name=safe_name,
        description=payload.description,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_active=payload.is_active,
        created_by=created_by or payload.created_by,
    )

    return create_installation(db, installation)


def update_installation_service(
    db: Session,
    installation_id: UUID,
    payload: InstallationUpdate,
    modified_by: str | None = None,
):
    installation = get_installation_by_id(db, installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )

    new_client_id = installation.client_id if payload.client_id is None else payload.client_id
    new_code = installation.code if payload.code is None else payload.code.strip()
    new_name = installation.name if payload.name is None else payload.name.strip()

    if not new_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'code' is required",
        )

    if not new_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'name' is required",
        )

    if payload.client_id is not None and payload.client_id != installation.client_id:
        client = get_client_by_id(db, payload.client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )

    if (new_client_id != installation.client_id) or (new_code != installation.code):
        existing = get_installation_by_client_and_code(db, new_client_id, new_code)
        if existing and existing.id != installation.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Installation with code '{new_code}' already exists for this client",
            )

    if payload.client_id is not None:
        installation.client_id = payload.client_id
    if payload.code is not None:
        installation.code = new_code
    if payload.name is not None:
        installation.name = new_name
    if payload.description is not None:
        installation.description = payload.description
    if payload.address is not None:
        installation.address = payload.address
    if payload.city is not None:
        installation.city = payload.city
    if payload.state is not None:
        installation.state = payload.state
    if payload.postal_code is not None:
        installation.postal_code = payload.postal_code
    if payload.country is not None:
        installation.country = payload.country
    if payload.latitude is not None:
        installation.latitude = payload.latitude
    if payload.longitude is not None:
        installation.longitude = payload.longitude
    if payload.is_active is not None:
        installation.is_active = payload.is_active
    if modified_by is not None:
        installation.modified_by = modified_by
    elif payload.modified_by is not None:
        installation.modified_by = payload.modified_by

    installation.modified_on = datetime.utcnow()

    return update_installation(db, installation)


def delete_installation_service(db: Session, installation_id: UUID):
    installation = get_installation_by_id(db, installation_id)
    if not installation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Installation not found",
        )

    installation.is_deleted = True
    installation.deleted_on = datetime.utcnow()
    installation.modified_on = datetime.utcnow()
    installation.is_active = False

    return update_installation(db, installation)
