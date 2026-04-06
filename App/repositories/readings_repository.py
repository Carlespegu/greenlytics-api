from sqlalchemy.orm import Session

from database.models.device import Device
from database.models.installation import Installation
from database.models.reading import Reading
from database.models.reading_type import ReadingType
from database.models.reading_value import ReadingValue


def create_reading(db: Session, reading: Reading):
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def list_readings_with_context(db: Session, limit: int = 500):
    rows = (
        db.query(
            Reading,
            Device.name.label("device_name"),
            Device.status.label("device_status"),
            Installation.name.label("installation_name"),
            ReadingType.code.label("reading_type_code"),
            ReadingValue.value_decimal,
            ReadingValue.value_integer,
            ReadingValue.value_text,
            ReadingValue.value_boolean,
        )
        .outerjoin(Device, Device.id == Reading.device_id)
        .outerjoin(Installation, Installation.id == Reading.installation_id)
        .outerjoin(ReadingValue, ReadingValue.reading_id == Reading.id)
        .outerjoin(ReadingType, ReadingType.id == ReadingValue.reading_type_id)
        .order_by(Reading.ts.desc())
        .limit(limit)
        .all()
    )

    readings_map = {}

    for row in rows:
        reading = row[0]
        reading_id = str(reading.id)

        if reading_id not in readings_map:
            readings_map[reading_id] = {
                "id": reading.id,
                "device_id": reading.device_id,
                "device_name": row.device_name,
                "installation_id": reading.installation_id,
                "installation_name": row.installation_name,
                "status": row.device_status,
                "created_at": reading.created_on,
                "temperature": None,
                "humidity": None,
                "light": None,
                "humudity_soil": None,
                "rain": None,
            }

        code = (row.reading_type_code or "").upper()
        value = row.value_decimal
        if value is None:
            value = row.value_integer
        if value is None:
            value = row.value_text
        if value is None:
            value = row.value_boolean

        if code in {"TEMP", "TEMPERATURE", "TEMP_C", "TEMPC"} and value is not None:
            readings_map[reading_id]["temperature"] = float(value)
        elif code in {"HUM", "HUMIDITY", "HUM_AIR", "HUMAIR"} and value is not None:
            readings_map[reading_id]["humidity"] = float(value)
        elif code in {"LIGHT", "LDR", "LUX", "LIGHT_INTENSITY", "LDR_RAW"} and value is not None:
            readings_map[reading_id]["light"] = float(value)
        elif code in {"SOIL", "SOIL_PERCENT", "SOILPERCENT"} and value is not None:
            readings_map[reading_id]["humudity_soil"] = float(value)
        elif code in {"RAIN"} and value is not None:
            readings_map[reading_id]["rain"] = value

    return list(readings_map.values())
