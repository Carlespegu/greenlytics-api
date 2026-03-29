from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from App.core.security import create_access_token
from App.dependencies.auth import get_current_active_user
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
def me(current_user=Depends(get_current_active_user)):
    return CurrentUserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        client_id=current_user.client_id,
        role_id=current_user.role_id,
        role_code=current_user.role_code,
        role_name=current_user.role_name,
        is_active=current_user.is_active,
    )
