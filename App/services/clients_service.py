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
    existing = get_client_by_code(db, payload.Code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with code '{payload.Code}' already exists"
        )

    api_key = generate_api_key()

    while get_client_by_api_key(db, api_key):
        api_key = generate_api_key()

    api_secret_hash = hash_secret(payload.ApiSecret)

    client = Client(
        code=payload.Code,
        name=payload.Name,
        trade_name=payload.TradeName,
        tax_id=payload.TaxId,
        email=payload.Email,
        phone=payload.Phone,
        website=payload.Website,
        address=payload.Address,
        city=payload.City,
        state=payload.State,
        postal_code=payload.PostalCode,
        country=payload.Country,
        is_active=payload.IsActive,
        client_type=payload.ClientType,
        notes=payload.Notes,
        external_id=payload.ExternalId,
        api_key=api_key,
        api_secret_hash=api_secret_hash,
        app_name=payload.AppName,
        logo_url=payload.LogoUrl,
        favicon_url=payload.FaviconUrl,
        primary_color=payload.PrimaryColor,
        secondary_color=payload.SecondaryColor,
        created_by=payload.CreatedBy,
    )

    return create_client(db, client)


def update_client_service(db: Session, client_id: UUID, payload: ClientUpdate):
    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )

    if payload.Name is not None:
        client.name = payload.Name
    if payload.TradeName is not None:
        client.trade_name = payload.TradeName
    if payload.TaxId is not None:
        client.tax_id = payload.TaxId
    if payload.Email is not None:
        client.email = payload.Email
    if payload.Phone is not None:
        client.phone = payload.Phone
    if payload.Website is not None:
        client.website = payload.Website
    if payload.Address is not None:
        client.address = payload.Address
    if payload.City is not None:
        client.city = payload.City
    if payload.State is not None:
        client.state = payload.State
    if payload.PostalCode is not None:
        client.postal_code = payload.PostalCode
    if payload.Country is not None:
        client.country = payload.Country
    if payload.IsActive is not None:
        client.is_active = payload.IsActive
    if payload.ClientType is not None:
        client.client_type = payload.ClientType
    if payload.Notes is not None:
        client.notes = payload.Notes
    if payload.ExternalId is not None:
        client.external_id = payload.ExternalId

    # Branding MVP
    if payload.AppName is not None:
        client.app_name = payload.AppName
    if payload.LogoUrl is not None:
        client.logo_url = payload.LogoUrl
    if payload.FaviconUrl is not None:
        client.favicon_url = payload.FaviconUrl
    if payload.PrimaryColor is not None:
        client.primary_color = payload.PrimaryColor
    if payload.SecondaryColor is not None:
        client.secondary_color = payload.SecondaryColor

    if payload.ModifiedBy is not None:
        client.modified_by = payload.ModifiedBy

    client.modified_on = datetime.utcnow()

    return update_client(db, client)