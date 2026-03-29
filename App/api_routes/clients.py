from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.clients import ClientCreate, ClientResponse, ClientUpdate
from App.schemas.clients_search import ClientSearchRequest, ClientSearchResponse
from App.services.clients_service import (
    create_client_service,
    get_client_service,
    list_clients_service,
    search_clients_service,
    update_client_service,
)
from database.session import get_db

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=List[ClientResponse])
def list_clients(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return list_clients_service(db)


@router.post("/search", response_model=ClientSearchResponse)
def search_clients(
    payload: ClientSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return search_clients_service(db, payload)


@router.get("/{client_id}", response_model=ClientResponse)
def get_client(
    client_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    ensure_client_scope(current_user, client_id)
    return get_client_service(db, client_id)


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    payload: ClientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN")),
):
    return create_client_service(db, payload)


@router.put("/{client_id}", response_model=ClientResponse)
def update_client(
    client_id: UUID,
    payload: ClientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, client_id)
    return update_client_service(db, client_id, payload)
