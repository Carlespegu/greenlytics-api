from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.installation_devices_repository import get_active_assignment_by_device_id
from App.repositories.installations_repository import get_installation_by_id
from App.repositories.plants_repository import get_active_plants_by_installation_id
from App.repositories.readings_repository import create_reading, list_readings_with_context
from App.services.alerts_engine import enqueue_alert_jobs_for_reading

from database.models.reading import Reading
from database.models.reading_value import ReadingValue
from database.models.reading_type import ReadingType


def list_device_readings_service(db: Session):
    return list_readings_with_context(db)


def create_device_reading_service(db: Session, device, payload):
    installation_id = None
    client_id = None

    active_assignment = get_active_assignment_by_device_id(db, device.id)
    if active_assignment:
        installation_id = active_assignment.installation_id
        installation = get_installation_by_id(db, installation_id)
        if installation:
            client_id = installation.client_id

    plant_id = getattr(payload, "plant_id", None)

    if plant_id is None and installation_id is not None:
        plants = get_active_plants_by_installation_id(db, installation_id)

        if len(plants) == 1:
            plant_id = plants[0].id
        elif len(plants) > 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="More than one active plant found for installation. Automatic plant mapping is ambiguous.",
            )

    reading = Reading(
        device_id=device.id,
        installation_id=installation_id,
        client_id=client_id,
        plant_id=plant_id,
        ts=getattr(payload, "ts", None) or datetime.utcnow(),
    )

    values = getattr(payload, "values", [])

    if not values:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="values[] is required",
        )

    reading_values = []

    for item in values:
        code = getattr(item, "reading_type_code", None)
        if not code:
            continue

        reading_type = (
            db.query(ReadingType)
            .filter(ReadingType.code == code.upper())
            .first()
        )

        if not reading_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ReadingType not found for code '{code}'",
            )

        rv = ReadingValue(
            reading=reading,
            reading_type_id=reading_type.id,
            value_decimal=getattr(item, "value_decimal", None),
            value_integer=getattr(item, "value_integer", None),
            value_text=getattr(item, "value_text", None),
            value_boolean=getattr(item, "value_boolean", None),
        )

        reading_values.append(rv)

    reading.values = reading_values

    created = create_reading(db, reading)

    enqueue_alert_jobs_for_reading(db, created)

    device.last_seen_on = datetime.utcnow()
    device.status = "online"

    db.commit()
    db.refresh(device)

    return created
