from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.devices_repository import get_device_by_api_key
from database.session import get_db


def get_current_device(
    x_api_key: str = Header(..., alias="x-api-key"),
    db: Session = Depends(get_db),
):
    device = get_device_by_api_key(db, x_api_key)
    if not device:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device API key",
        )

    if getattr(device, "is_deleted", False):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid device API key",
        )

    if not getattr(device, "is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive device",
        )

    return device
