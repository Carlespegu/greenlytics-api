from typing import List, Union

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from App.dependencies.auth import require_roles
from App.dependencies.device_auth import get_current_device
from App.schemas.device_readings import (
    DeviceReadingIn,
    DeviceReadingListItem,
    DeviceReadingResponse,
    DeviceReadingsBatchIn,
    DeviceReadingsBatchResponse,
)
from App.services.device_readings_service import (
    create_device_reading_service,
    create_device_readings_batch_service,
    list_device_readings_service,
)
from database.session import get_db

router = APIRouter(prefix="/device-readings", tags=["Device Readings"])


@router.get("", response_model=List[DeviceReadingListItem])
def list_device_readings(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    return list_device_readings_service(db)


@router.post("", response_model=Union[DeviceReadingResponse, DeviceReadingsBatchResponse])
def create_device_reading(
    payload: Union[DeviceReadingsBatchIn, DeviceReadingIn],
    db: Session = Depends(get_db),
    device=Depends(get_current_device),
):
    if isinstance(payload, DeviceReadingsBatchIn):
        return create_device_readings_batch_service(db, device, payload)

    return create_device_reading_service(db, device, payload)
