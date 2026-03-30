from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from App.core.security import create_access_token
from App.dependencies.auth import get_current_active_user
from App.repositories.clients_repository import get_client_by_id
from App.schemas.auth import CurrentUserResponse, TokenResponse
from App.services.auth_service import authenticate_user
from database.session import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    access_token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=CurrentUserResponse)
def me(
    current_user=Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    client = get_client_by_id(db, current_user.client_id)

    app_name = None
    logo_url = None
    favicon_url = None
    primary_color = None
    secondary_color = None
    client_name = None
    client_trade_name = None

    if client:
        client_name = client.name
        client_trade_name = client.trade_name
        app_name = client.app_name or client.trade_name or client.name
        logo_url = client.logo_url
        favicon_url = client.favicon_url
        primary_color = client.primary_color
        secondary_color = client.secondary_color

    return CurrentUserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        client_id=current_user.client_id,
        role_id=current_user.role_id,
        role_code=current_user.role_code,
        role_name=current_user.role_name,
        is_active=current_user.is_active,
        client_name=client_name,
        client_trade_name=client_trade_name,
        app_name=app_name,
        logo_url=logo_url,
        favicon_url=favicon_url,
        primary_color=primary_color,
        secondary_color=secondary_color,
    )