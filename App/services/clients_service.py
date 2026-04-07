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
    get_client_by_email,
    get_client_by_id,
    get_client_by_tax_id,
    search_clients,
    update_client,
)
from App.schemas.clients import ClientCreate, ClientUpdate
from database.models.clients import Client


def list_clients_service(db: Session, client_id: UUID | None = None):
    return get_all_clients(db, client_id=client_id)


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


def _generate_client_code(db: Session) -> str:
    clients = get_all_clients(db)

    max_number = 0
    for client in clients:
        code = (client.code or "").strip().upper()
        if code.startswith("CLI-"):
            suffix = code.replace("CLI-", "")
            if suffix.isdigit():
                max_number = max(max_number, int(suffix))

    return f"CLI-{max_number + 1:03d}"


def _require_value(value: str | None, field_name: str):
    if value is None or not str(value).strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field '{field_name}' is required"
        )


def create_client_service(db: Session, payload: ClientCreate):
    _require_value(payload.Name, "Name")
    _require_value(payload.TradeName, "TradeName")
    _require_value(payload.TaxId, "TaxId")
    _require_value(payload.Email, "Email")
    _require_value(payload.Phone, "Phone")
    _require_value(payload.ApiSecret, "ApiSecret")

    safe_name = payload.Name.strip()
    safe_trade_name = payload.TradeName.strip()
    safe_tax_id = payload.TaxId.strip()
    safe_email = payload.Email.strip().lower()
    safe_phone = payload.Phone.strip()

    safe_client_type = (payload.ClientType or "DEMO").strip().upper()
    if safe_client_type not in ["DEMO", "PREMIUM", "ENTERPRISE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field 'ClientType' must be DEMO, PREMIUM or ENTERPRISE"
        )

    safe_code = (payload.Code or "").strip()
    if not safe_code:
        safe_code = _generate_client_code(db)

    existing = get_client_by_code(db, safe_code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with code '{safe_code}' already exists"
        )

    existing_email = get_client_by_email(db, safe_email)
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with email '{safe_email}' already exists"
        )

    existing_tax_id = get_client_by_tax_id(db, safe_tax_id)
    if existing_tax_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Client with TaxId '{safe_tax_id}' already exists"
        )

    api_key = generate_api_key()

    while get_client_by_api_key(db, api_key):
        api_key = generate_api_key()

    api_secret_hash = hash_secret(payload.ApiSecret)

    client = Client(
        code=safe_code,
        name=safe_name,
        trade_name=safe_trade_name,
        tax_id=safe_tax_id,
        email=safe_email,
        phone=safe_phone,
        website=(payload.Website or "").strip() or None,
        address=(payload.Address or "").strip() or None,
        city=(payload.City or "").strip() or None,
        state=(payload.State or "").strip() or None,
        postal_code=(payload.PostalCode or "").strip() or None,
        country=(payload.Country or "").strip() or None,
        is_active=payload.IsActive,
        client_type=safe_client_type,
        notes=(payload.Notes or "").strip() or None,
        external_id=(payload.ExternalId or "").strip() or None,
        api_key=api_key,
        api_secret_hash=api_secret_hash,
        app_name=(payload.AppName or "").strip() or None,
        logo_url=(payload.LogoUrl or "").strip() or None,
        favicon_url=(payload.FaviconUrl or "").strip() or None,
        primary_color=(payload.PrimaryColor or "").strip() or None,
        secondary_color=(payload.SecondaryColor or "").strip() or None,
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

    if payload.Email is not None:
        safe_email = payload.Email.strip().lower()
        existing_email = get_client_by_email(db, safe_email)
        if existing_email and existing_email.id != client.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Client with email '{safe_email}' already exists"
            )
        client.email = safe_email

    if payload.TaxId is not None:
        safe_tax_id = payload.TaxId.strip()
        existing_tax_id = get_client_by_tax_id(db, safe_tax_id)
        if existing_tax_id and existing_tax_id.id != client.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Client with TaxId '{safe_tax_id}' already exists"
            )
        client.tax_id = safe_tax_id

    if payload.Name is not None:
        client.name = payload.Name.strip()
    if payload.TradeName is not None:
        client.trade_name = payload.TradeName.strip()
    if payload.Phone is not None:
        client.phone = payload.Phone.strip()
    if payload.Website is not None:
        client.website = payload.Website.strip() or None
    if payload.Address is not None:
        client.address = payload.Address.strip() or None
    if payload.City is not None:
        client.city = payload.City.strip() or None
    if payload.State is not None:
        client.state = payload.State.strip() or None
    if payload.PostalCode is not None:
        client.postal_code = payload.PostalCode.strip() or None
    if payload.Country is not None:
        client.country = payload.Country.strip() or None
    if payload.IsActive is not None:
        client.is_active = payload.IsActive
    if payload.ClientType is not None:
        safe_client_type = payload.ClientType.strip().upper()
        if safe_client_type not in ["DEMO", "PREMIUM", "ENTERPRISE"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Field 'ClientType' must be DEMO, PREMIUM or ENTERPRISE"
            )
        client.client_type = safe_client_type
    if payload.Notes is not None:
        client.notes = payload.Notes.strip() or None
    if payload.ExternalId is not None:
        client.external_id = payload.ExternalId.strip() or None

    if payload.AppName is not None:
        client.app_name = payload.AppName.strip() or None
    if payload.LogoUrl is not None:
        client.logo_url = payload.LogoUrl.strip() or None
    if payload.FaviconUrl is not None:
        client.favicon_url = payload.FaviconUrl.strip() or None
    if payload.PrimaryColor is not None:
        client.primary_color = payload.PrimaryColor.strip() or None
    if payload.SecondaryColor is not None:
        client.secondary_color = payload.SecondaryColor.strip() or None

    if payload.ModifiedBy is not None:
        client.modified_by = payload.ModifiedBy

    client.modified_on = datetime.utcnow()

    return update_client(db, client)
