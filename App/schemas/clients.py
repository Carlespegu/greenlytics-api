from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, ConfigDict


class ClientCreate(BaseModel):
    Code: str
    Name: str
    TradeName: Optional[str] = None
    TaxId: Optional[str] = None

    Email: Optional[EmailStr] = None
    Phone: Optional[str] = None
    Website: Optional[str] = None

    Address: Optional[str] = None
    City: Optional[str] = None
    State: Optional[str] = None
    PostalCode: Optional[str] = None
    Country: Optional[str] = None

    IsActive: bool = True
    ClientType: Optional[str] = None
    Notes: Optional[str] = None

    ExternalId: Optional[str] = None
    ApiSecret: str

    # Branding MVP
    AppName: Optional[str] = None
    LogoUrl: Optional[str] = None
    FaviconUrl: Optional[str] = None
    PrimaryColor: Optional[str] = None
    SecondaryColor: Optional[str] = None

    CreatedBy: Optional[str] = None


class ClientUpdate(BaseModel):
    Name: Optional[str] = None
    TradeName: Optional[str] = None
    TaxId: Optional[str] = None

    Email: Optional[EmailStr] = None
    Phone: Optional[str] = None
    Website: Optional[str] = None

    Address: Optional[str] = None
    City: Optional[str] = None
    State: Optional[str] = None
    PostalCode: Optional[str] = None
    Country: Optional[str] = None

    IsActive: Optional[bool] = None
    ClientType: Optional[str] = None
    Notes: Optional[str] = None

    ExternalId: Optional[str] = None

    # Branding MVP
    AppName: Optional[str] = None
    LogoUrl: Optional[str] = None
    FaviconUrl: Optional[str] = None
    PrimaryColor: Optional[str] = None
    SecondaryColor: Optional[str] = None

    ModifiedBy: Optional[str] = None


class ClientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    code: str
    name: str
    trade_name: Optional[str] = None
    tax_id: Optional[str] = None

    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

    is_active: bool
    client_type: Optional[str] = None
    notes: Optional[str] = None

    external_id: Optional[str] = None
    api_key: Optional[str] = None

    # Branding MVP
    app_name: Optional[str] = None
    logo_url: Optional[str] = None
    favicon_url: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None

    created_on: Optional[datetime] = None
    created_by: Optional[str] = None
    modified_on: Optional[datetime] = None
    modified_by: Optional[str] = None
    deleted_on: Optional[datetime] = None
    is_deleted: bool