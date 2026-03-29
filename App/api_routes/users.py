from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.users import UserCreate, UserResponse, UserUpdate
from App.schemas.users_search import UserSearchRequest, UserSearchResponse
from App.services.users_service import (
    create_user_service,
    delete_user_service,
    get_user_service,
    list_users_service,
    search_users_service,
    update_user_service,
)
from database.session import get_db

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    client_id: Optional[UUID] = Query(None),
    is_active: Optional[bool] = Query(None),
    email: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    first_name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    effective_client_id = client_id
    if current_user.role_code.upper() != "ADMIN":
        effective_client_id = current_user.client_id

    return list_users_service(
        db=db,
        client_id=effective_client_id,
        is_active=is_active,
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
    )


@router.post("/search", response_model=UserSearchResponse)
def search_users(
    payload: UserSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role_code.upper() != "ADMIN":
        payload.client_id = {"filter_value": current_user.client_id, "comparator": "equals"}  # type: ignore

    return search_users_service(db, payload)


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    user = get_user_service(db, user_id)
    ensure_client_scope(current_user, user.client_id)
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, payload.client_id)
    return create_user_service(db, payload)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    user = get_user_service(db, user_id)
    ensure_client_scope(current_user, user.client_id)

    if payload.client_id is not None:
        ensure_client_scope(current_user, payload.client_id)

    return update_user_service(db, user_id, payload)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    user = get_user_service(db, user_id)
    ensure_client_scope(current_user, user.client_id)
    delete_user_service(db, user_id)
    return None
