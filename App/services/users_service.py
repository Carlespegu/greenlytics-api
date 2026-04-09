from datetime import datetime
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.core.concurrency import ensure_record_is_current
from App.core.security import hash_password
from App.repositories.clients_repository import get_client_by_id
from App.repositories.roles_repository import get_role_by_id
from App.repositories.users_repository import (
    create_user,
    get_all_users,
    get_user_by_email_for_client,
    get_user_by_id,
    get_user_by_username,
    search_users,
    update_user,
)
from App.schemas.users import UserCreate, UserUpdate
from database.models.users import User

ALLOWED_ROLE_CODES = {"MANAGER", "VIEWER"}


def _require_value(value: str | None, field_name: str):
    if value is None or not str(value).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field '{field_name}' is required",
        )



def list_users_service(
    db: Session,
    client_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    email: Optional[str] = None,
    username: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
):
    return get_all_users(
        db=db,
        client_id=client_id,
        is_active=is_active,
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )



def search_users_service(db: Session, payload):
    try:
        return search_users(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc



def get_user_service(db: Session, user_id: UUID):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user



def create_user_service(db: Session, payload: UserCreate):
    _require_value(payload.username, "username")
    _require_value(payload.email, "email")
    _require_value(payload.password, "password")
    _require_value(payload.first_name, "first_name")

    safe_username = payload.username.strip()
    safe_email = str(payload.email).strip().lower()
    safe_first_name = payload.first_name.strip()
    safe_last_name = (payload.last_name or "").strip() or None

    existing_username = get_user_by_username(db, safe_username)
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with username '{safe_username}' already exists",
        )

    existing_email = get_user_by_email_for_client(db, payload.client_id, safe_email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"User with email '{safe_email}' already exists for this client",
        )

    client = get_client_by_id(db, payload.client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    role = get_role_by_id(db, payload.role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    if role.code.upper() not in ALLOWED_ROLE_CODES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User role must be MANAGER or VIEWER",
        )

    user = User(
        username=safe_username,
        email=safe_email,
        password_hash=hash_password(payload.password),
        client_id=payload.client_id,
        role_id=payload.role_id,
        first_name=safe_first_name,
        last_name=safe_last_name,
        is_active=payload.is_active,
    )

    return create_user(db, user)



def update_user_service(db: Session, user_id: UUID, payload: UserUpdate):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    ensure_record_is_current(payload.modified_on, user.modified_on)

    if payload.username is not None and payload.username.strip() != user.username:
        safe_username = payload.username.strip()
        existing_username = get_user_by_username(db, safe_username)
        if existing_username and existing_username.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with username '{safe_username}' already exists",
            )
        user.username = safe_username

    if payload.email is not None:
        safe_email = str(payload.email).strip().lower()
        if safe_email != user.email:
            existing_email = get_user_by_email_for_client(db, user.client_id, safe_email)
            if existing_email and existing_email.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"User with email '{safe_email}' already exists for this client",
                )
            user.email = safe_email

    if payload.client_id is not None and payload.client_id != user.client_id:
        client = get_client_by_id(db, payload.client_id)
        if not client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Client not found",
            )
        user.client_id = payload.client_id

    if payload.role_id is not None and payload.role_id != user.role_id:
        role = get_role_by_id(db, payload.role_id)
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found",
            )
        if role.code.upper() not in ALLOWED_ROLE_CODES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User role must be MANAGER or VIEWER",
            )
        user.role_id = payload.role_id

    if payload.password is not None and payload.password.strip():
        user.password_hash = hash_password(payload.password)

    if payload.first_name is not None:
        _require_value(payload.first_name, "first_name")
        user.first_name = payload.first_name.strip()

    if payload.last_name is not None:
        user.last_name = payload.last_name.strip() or None

    if payload.is_active is not None:
        user.is_active = payload.is_active

    user.modified_on = datetime.utcnow()
    return update_user(db, user)



def delete_user_service(db: Session, user_id: UUID):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    user.is_deleted = True
    user.deleted_on = datetime.utcnow()
    user.modified_on = datetime.utcnow()
    user.is_active = False

    return update_user(db, user)
