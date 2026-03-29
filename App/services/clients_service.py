from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.core.security import generate_api_key, hash_secret
from App.repositories.clients_repository import (
    create_client,
    get_all_clients,
    get_client_by_api_key,
    get_client_by_code,
    get_client_by_id,
    search_clients,
    update_client,
)
from App.schemas.clients import ClientCreate, ClientUpdate
from database.models.clients import Client


def list_clients_service(db: Session):
    return get_all_clients(db)


def search_clients_service(db: Session, payload):
    try:
        return search_clients(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def get_client_service(db: Session, client_id: UUID):
    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    return client


def create_client_service(db: Session, payload: ClientCreate):
    existing = get_client_by_code(db, payload.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with code '{payload.code}' already exists"
        )

    api_key = generate_api_key()

    while get_client_by_api_key(db, api_key):
        api_key = generate_api_key()

    api_secret_hash = hash_secret(payload.api_secret)

    client = Client(
        code=payload.code,
        name=payload.name,
        trade_name=payload.trade_name,
        tax_id=payload.tax_id,
        email=payload.email,
        phone=payload.phone,
        website=payload.website,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        postal_code=payload.postal_code,
        country=payload.country,
        is_active=payload.is_active,
        client_type=payload.client_type,
        notes=payload.notes,
        external_id=payload.external_id,
        api_key=api_key,
        api_secret_hash=api_secret_hash,
        created_by=payload.created_by,
    )

    return create_client(db, client)


def update_client_service(db: Session, client_id: UUID, payload: ClientUpdate):
    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    if payload.name is not None:
        client.name = payload.name
    if payload.trade_name is not None:
        client.trade_name = payload.trade_name
    if payload.tax_id is not None:
        client.tax_id = payload.tax_id
    if payload.email is not None:
        client.email = payload.email
    if payload.phone is not None:
        client.phone = payload.phone
    if payload.website is not None:
        client.website = payload.website
    if payload.address is not None:
        client.address = payload.address
    if payload.city is not None:
        client.city = payload.city
    if payload.state is not None:
        client.state = payload.state
    if payload.postal_code is not None:
        client.postal_code = payload.postal_code
    if payload.country is not None:
        client.country = payload.country
    if payload.is_active is not None:
        client.is_active = payload.is_active
    if payload.client_type is not None:
        client.client_type = payload.client_type
    if payload.notes is not None:
        client.notes = payload.notes
    if payload.external_id is not None:
        client.external_id = payload.external_id
    if payload.modified_by is not None:
        client.modified_by = payload.modified_by

    client.modified_on = datetime.utcnow()

    return update_client(db, client)
