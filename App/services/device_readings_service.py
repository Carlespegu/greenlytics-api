from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.installation_devices_repository import get_active_assignment_by_device_id
from App.repositories.installations_repository import get_installation_by_id
from App.repositories.plants_repository import get_plant_by_id
from App.repositories.readings_repository import create_reading
from database.models.reading import Reading


def create_device_reading_service(db: Session, device, payload):
    installation_id = None
    client_id = None

    active_assignment = get_active_assignment_by_device_id(db, device.id)
    if active_assignment:
        installation_id = active_assignment.installation_id
        installation = get_installation_by_id(db, installation_id)
        if installation:
            client_id = installation.client_id

    if payload.plant_id is not None:
        plant = get_plant_by_id(db, payload.plant_id)
        if not plant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plant not found",
            )

        if client_id is not None and plant.client_id != client_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Plant does not belong to the resolved client context",
            )

        if installation_id is not None and plant.installation_id != installation_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Plant does not belong to the resolved installation context",
            )

    reading = Reading(
        device_id=device.id,
        installation_id=installation_id,
        client_id=client_id,
        plant_id=payload.plant_id,
        ts=payload.ts or datetime.utcnow(),
        temp_c=payload.temp_c,
        hum_air=payload.hum_air,
        ldr_raw=payload.ldr_raw,
        soil_percent=payload.soil_percent,
        rain=payload.rain,
        rssi=payload.rssi,
    )

    created = create_reading(db, reading)

    device.last_seen_on = datetime.utcnow()
    device.status = "online"
    db.commit()
    db.refresh(device)

    return created
