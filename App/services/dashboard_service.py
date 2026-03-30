from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy.orm import Session, joinedload

from database.models.device import Device
from database.models.installation import Installation
from database.models.installation_device import InstallationDevice
from database.models.plant import Plant
from database.models.reading import Reading
from database.models.reading_value import ReadingValue


ONLINE_STATUSES = {"online", "active", "ok"}
TYPE_LABELS = {
    "SOIL_PERCENT": "Humitat terra",
    "LDR_RAW": "Llum",
    "TEMP_C": "Temperatura",
    "HUM_AIR": "Humitat ambient",
    "RAIN": "Pluja",
    "RSSI": "Senyal WiFi",
}


def _utc_now():
    return datetime.now(timezone.utc)


def _to_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _minutes_ago_text(dt: datetime | None) -> str:
    if dt is None:
        return "Sense dades"

    now = _utc_now()
    ref = _to_utc(dt)
    delta_minutes = max(0, int((now - ref).total_seconds() // 60))

    if delta_minutes < 1:
        return "Ara mateix"
    if delta_minutes == 1:
        return "Fa 1 min"
    if delta_minutes < 60:
        return f"Fa {delta_minutes} min"

    hours = delta_minutes // 60
    if hours == 1:
        return "Fa 1 h"
    if hours < 24:
        return f"Fa {hours} h"

    days = hours // 24
    if days == 1:
        return "Fa 1 dia"
    return f"Fa {days} dies"


def _reading_values_map(reading: Reading):
    result = {}
    for item in reading.values:
        code = (item.reading_type.code or "").upper() if item.reading_type else ""
        if not code:
            continue
        if item.value_decimal is not None:
            result[code] = float(item.value_decimal)
        elif item.value_integer is not None:
            result[code] = float(item.value_integer)
        elif item.value_text is not None:
            result[code] = item.value_text
        elif item.value_boolean is not None:
            result[code] = item.value_boolean
        else:
            result[code] = None
    return result


def _format_value(code: str, value):
    if value is None:
        return "Sense dades"
    if code in {"SOIL_PERCENT", "HUM_AIR"}:
        return f"{int(round(float(value)))}%"
    if code == "TEMP_C":
        return f"{float(value):.1f} °C"
    if code == "RSSI":
        return f"{int(value)} dBm"
    if code == "LDR_RAW":
        return str(int(value))
    if code == "RAIN":
        return "Plou" if str(value).lower() == "rain" else "Sec"
    return str(value)


def _plant_status_from_soil(soil_percent):
    if soil_percent is None:
        return "Sense dades"
    soil = float(soil_percent)
    if soil < 30:
        return "Critical"
    if soil < 45:
        return "Warning"
    return "OK"


def get_dashboard_summary_service(db: Session, current_user):
    client_id = None if current_user.role_code.upper() == "ADMIN" else current_user.client_id

    plants_query = db.query(Plant).filter(Plant.is_deleted == False)  # noqa: E712
    if client_id is not None:
        plants_query = plants_query.filter(Plant.client_id == client_id)
    plants = plants_query.order_by(Plant.name.asc()).all()

    devices_query = (
        db.query(Device)
        .join(InstallationDevice, InstallationDevice.device_id == Device.id)
        .join(Installation, Installation.id == InstallationDevice.installation_id)
        .filter(Device.is_deleted == False, InstallationDevice.is_active == True)  # noqa: E712
    )
    if client_id is not None:
        devices_query = devices_query.filter(Installation.client_id == client_id)
    devices = devices_query.order_by(Device.name.asc()).all()

    readings_query = (
        db.query(Reading)
        .options(joinedload(Reading.values).joinedload(ReadingValue.reading_type))
        .order_by(Reading.ts.desc())
    )
    if client_id is not None:
        readings_query = readings_query.filter(Reading.client_id == client_id)
    recent_readings = readings_query.limit(60).all()

    installation_ids = {item.installation_id for item in recent_readings if item.installation_id is not None}
    if plants:
        installation_ids.update({item.installation_id for item in plants if item.installation_id is not None})

    installations = {}
    if installation_ids:
        installation_rows = db.query(Installation).filter(Installation.id.in_(installation_ids)).all()
        installations = {item.id: item for item in installation_rows}

    plant_map = {item.id: item for item in plants}
    device_map = {item.id: item for item in devices}

    total_plants = len(plants)
    active_plants = sum(1 for item in plants if item.is_active)
    total_devices = len(devices)
    online_devices = sum(
        1
        for item in devices
        if (item.status or "").lower() in ONLINE_STATUSES
    )

    latest_by_plant = {}
    latest_by_device = {}
    for reading in recent_readings:
        if reading.plant_id and reading.plant_id not in latest_by_plant:
            latest_by_plant[reading.plant_id] = reading
        if reading.device_id and reading.device_id not in latest_by_device:
            latest_by_device[reading.device_id] = reading

    chart_source = list(reversed(recent_readings[:12]))
    chart_data = []
    for reading in chart_source:
        value_map = _reading_values_map(reading)
        chart_data.append(
            {
                "label": reading.ts.strftime("%H:%M"),
                "soil_percent": value_map.get("SOIL_PERCENT"),
                "ldr_raw": value_map.get("LDR_RAW"),
                "temp_c": value_map.get("TEMP_C"),
            }
        )

    flattened_recent = []
    for reading in recent_readings[:8]:
        value_map = _reading_values_map(reading)
        device_name = device_map.get(reading.device_id).name if reading.device_id in device_map else str(reading.device_id)
        plant_name = plant_map.get(reading.plant_id).name if reading.plant_id in plant_map else "Sense planta"

        for code in ["SOIL_PERCENT", "LDR_RAW", "TEMP_C", "RAIN", "RSSI"]:
            if code not in value_map:
                continue
            flattened_recent.append(
                {
                    "plant": plant_name,
                    "type": TYPE_LABELS.get(code, code),
                    "value": _format_value(code, value_map.get(code)),
                    "device": device_name,
                    "time": _minutes_ago_text(reading.ts),
                }
            )
            if len(flattened_recent) >= 8:
                break
        if len(flattened_recent) >= 8:
            break

    plant_cards = []
    for plant in plants:
        latest = latest_by_plant.get(plant.id)
        values = _reading_values_map(latest) if latest else {}
        installation_name = installations.get(plant.installation_id).name if plant.installation_id in installations else "Sense instal·lació"
        plant_cards.append(
            {
                "plant_id": plant.id,
                "name": plant.name,
                "installation": installation_name,
                "status": _plant_status_from_soil(values.get("SOIL_PERCENT")),
                "humidity": values.get("SOIL_PERCENT"),
                "temperature": values.get("TEMP_C"),
                "light": values.get("LDR_RAW"),
                "rain": values.get("RAIN"),
                "rssi": int(values.get("RSSI")) if values.get("RSSI") is not None else None,
                "last_reading": _minutes_ago_text(latest.ts) if latest else None,
            }
        )

    if not plant_cards and recent_readings:
        # Fallback useful when there are readings but plant_id is null.
        for device_id, latest in latest_by_device.items():
            values = _reading_values_map(latest)
            device_name = device_map.get(device_id).name if device_id in device_map else str(device_id)
            installation_name = installations.get(latest.installation_id).name if latest.installation_id in installations else "Sense instal·lació"
            plant_cards.append(
                {
                    "plant_id": None,
                    "name": device_name,
                    "installation": installation_name,
                    "status": _plant_status_from_soil(values.get("SOIL_PERCENT")),
                    "humidity": values.get("SOIL_PERCENT"),
                    "temperature": values.get("TEMP_C"),
                    "light": values.get("LDR_RAW"),
                    "rain": values.get("RAIN"),
                    "rssi": int(values.get("RSSI")) if values.get("RSSI") is not None else None,
                    "last_reading": _minutes_ago_text(latest.ts),
                }
            )

    kpis = [
        {
            "title": "Plantes totals",
            "value": str(total_plants),
            "subtitle": "Plantes registrades",
        },
        {
            "title": "Plantes actives",
            "value": str(active_plants),
            "subtitle": "En seguiment",
        },
        {
            "title": "Devices online",
            "value": f"{online_devices} / {total_devices}",
            "subtitle": "Segons el camp status",
        },
        {
            "title": "Lectures recents",
            "value": str(len(recent_readings)),
            "subtitle": "Últims registres disponibles",
        },
    ]

    return {
        "generated_at": _utc_now(),
        "kpis": kpis,
        "chart_data": chart_data,
        "latest_readings": flattened_recent,
        "plants": plant_cards,
    }
