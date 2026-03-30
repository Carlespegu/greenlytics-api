from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.installation_devices_repository import get_active_assignment_by_device_id
from App.repositories.installations_repository import get_installation_by_id
from App.repositories.plants_repository import get_plant_by_id
from App.repositories.readings_repository import create_reading
from database.models.reading import Reading


def _extract_flat_reading_values(payload):
    extracted = {
        "temp_c": None,
        "hum_air": None,
        "ldr_raw": None,
        "soil_percent": None,
        "rain": None,
        "rssi": None,
    }

    values = getattr(payload, "values", None)

    if values:
        for item in values:
            code = getattr(item, "reading_type_code", None)
            if not code:
                continue

            value_decimal = getattr(item, "value_decimal", None)
            value_integer = getattr(item, "value_integer", None)
            value_text = getattr(item, "value_text", None)
            value_boolean = getattr(item, "value_boolean", None)

            if code == "temp_c":
                extracted["temp_c"] = value_decimal
            elif code == "hum_air":
                extracted["hum_air"] = value_decimal
            elif code == "ldr_raw":
                extracted["ldr_raw"] = value_integer
            elif code == "soil_percent":
                extracted["soil_percent"] = value_integer
            elif code == "rain":
                if value_text is not None:
                    extracted["rain"] = value_text
                elif value_boolean is not None:
                    extracted["rain"] = "rain" if value_boolean else "dry"
            elif code == "rssi":
                extracted["rssi"] = value_integer

        return extracted

    # Compatibilitat amb format antic
    extracted["temp_c"] = getattr(payload, "temp_c", None)
    extracted["hum_air"] = getattr(payload, "hum_air", None)
    extracted["ldr_raw"] = getattr(payload, "ldr_raw", None)
    extracted["soil_percent"] = getattr(payload, "soil_percent", None)
    extracted["rain"] = getattr(payload, "rain", None)
    extracted["rssi"] = getattr(payload, "rssi", None)

    return extracted


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

    if plant_id is not None:
        plant = get_plant_by_id(db, plant_id)
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

    flat_values = _extract_flat_reading_values(payload)

    reading = Reading(
        device_id=device.id,
        installation_id=installation_id,
        client_id=client_id,
        plant_id=plant_id,
        ts=getattr(payload, "ts", None) or datetime.utcnow(),
        temp_c=flat_values["temp_c"],
        hum_air=flat_values["hum_air"],
        ldr_raw=flat_values["ldr_raw"],
        soil_percent=flat_values["soil_percent"],
        rain=flat_values["rain"],
        rssi=flat_values["rssi"],
    )

    created = create_reading(db, reading)

    device.last_seen_on = datetime.utcnow()
    device.status = "online"
    db.commit()
    db.refresh(device)

    return created