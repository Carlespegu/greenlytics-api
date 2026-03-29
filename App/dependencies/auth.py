from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from App.core.config import settings
from App.repositories.roles_repository import get_role_by_id
from App.repositories.users_repository import get_user_by_id
from database.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class CurrentUserContext(BaseModel):
    id: UUID
    username: str
    email: str | None = None
    client_id: UUID
    role_id: UUID
    role_code: str
    role_name: str
    is_active: bool


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> CurrentUserContext:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        subject = payload.get("sub")
        if subject is None:
            raise credentials_exception

        user = get_user_by_id(db, UUID(subject))
        if not user:
            raise credentials_exception

        role = get_role_by_id(db, user.role_id)
        if not role:
            raise credentials_exception

        return CurrentUserContext(
            id=user.id,
            username=user.username,
            email=user.email,
            client_id=user.client_id,
            role_id=user.role_id,
            role_code=role.code,
            role_name=role.name,
            is_active=user.is_active,
        )
    except (JWTError, ValueError):
        raise credentials_exception


def get_current_active_user(
    current_user: CurrentUserContext = Depends(get_current_user),
) -> CurrentUserContext:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


def require_roles(*allowed_roles: str) -> Callable:
    allowed = {role.upper() for role in allowed_roles}

    def dependency(
        current_user: CurrentUserContext = Depends(get_current_active_user),
    ) -> CurrentUserContext:
        if current_user.role_code.upper() not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency


def ensure_client_scope(current_user: CurrentUserContext, client_id: UUID) -> None:
    if current_user.role_code.upper() == "ADMIN":
        return

    if current_user.client_id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden for this client scope",
        )
