from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.schemas.roles import RoleCreate, RoleResponse, RoleUpdate
from App.services.roles_service import (
    create_role_service,
    delete_role_service,
    get_role_service,
    list_roles_service,
    update_role_service,
)
from database.session import get_db

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=List[RoleResponse])
def list_roles(db: Session = Depends(get_db)):
    return list_roles_service(db)


@router.get("/{role_id}", response_model=RoleResponse)
def get_role(role_id: UUID, db: Session = Depends(get_db)):
    return get_role_service(db, role_id)


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    return create_role_service(db, payload)


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: UUID, payload: RoleUpdate, db: Session = Depends(get_db)):
    return update_role_service(db, role_id, payload)


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(role_id: UUID, db: Session = Depends(get_db)):
    delete_role_service(db, role_id)
    return None
