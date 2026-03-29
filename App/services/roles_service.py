from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.roles_repository import (
    create_role,
    get_all_roles,
    get_role_by_code,
    get_role_by_id,
    update_role,
)
from App.schemas.roles import RoleCreate, RoleUpdate
from database.models.roles import Role


def list_roles_service(db: Session):
    return get_all_roles(db)


def get_role_service(db: Session, role_id: UUID):
    role = get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


def create_role_service(db: Session, payload: RoleCreate):
    existing = get_role_by_code(db, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Role with code '{payload.code}' already exists",
        )

    role = Role(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        is_active=payload.is_active,
    )
    return create_role(db, role)


def update_role_service(db: Session, role_id: UUID, payload: RoleUpdate):
    role = get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    if payload.code is not None and payload.code != role.code:
        existing = get_role_by_code(db, payload.code)
        if existing and existing.id != role.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Role with code '{payload.code}' already exists",
            )
        role.code = payload.code

    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    if payload.is_active is not None:
        role.is_active = payload.is_active

    role.modified_on = datetime.utcnow()
    return update_role(db, role)


def delete_role_service(db: Session, role_id: UUID):
    role = get_role_by_id(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    role.is_deleted = True
    role.deleted_on = datetime.utcnow()
    role.modified_on = datetime.utcnow()
    role.is_active = False

    return update_role(db, role)
