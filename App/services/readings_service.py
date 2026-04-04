from sqlalchemy.orm import Session, joinedload

from database.models.device import Device
from database.models.installation import Installation
from database.models.installation_device import InstallationDevice
from database.models.plant import Plant
from database.models.reading import Reading
from database.models.reading_value import ReadingValue


def _reading_values_map(reading: Reading):
    result = {}
    for item in reading.values:
        code = (item.reading_type.code or '').upper() if item.reading_type else ''
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



def list_readings_service(db: Session, current_user, limit: int = 300):
    client_id = None if current_user.role_code.upper() == 'ADMIN' else current_user.client_id

    query = (
        db.query(Reading)
        .options(joinedload(Reading.values).joinedload(ReadingValue.reading_type))
        .order_by(Reading.ts.desc())
    )
    if client_id is not None:
        query = query.filter(Reading.client_id == client_id)

    readings = query.limit(limit).all()

    device_ids = {item.device_id for item in readings if item.device_id is not None}
    plant_ids = {item.plant_id for item in readings if item.plant_id is not None}
    installation_ids = {item.installation_id for item in readings if item.installation_id is not None}

    device_map = {}
    if device_ids:
        devices = db.query(Device).filter(Device.id.in_(device_ids)).all()
        device_map = {item.id: item for item in devices}

    plant_map = {}
    if plant_ids:
        plants = db.query(Plant).filter(Plant.id.in_(plant_ids)).all()
        plant_map = {item.id: item for item in plants}
        installation_ids.update({item.installation_id for item in plants if item.installation_id is not None})

    if device_ids:
        links = (
            db.query(InstallationDevice)
            .filter(InstallationDevice.device_id.in_(device_ids), InstallationDevice.is_active == True)  # noqa: E712
            .all()
        )
        device_installations = {item.device_id: item.installation_id for item in links}
        installation_ids.update(device_installations.values())
    else:
        device_installations = {}

    installation_map = {}
    if installation_ids:
        installations = db.query(Installation).filter(Installation.id.in_(installation_ids)).all()
        installation_map = {item.id: item for item in installations}

    items = []
    for reading in readings:
        values = _reading_values_map(reading)
        installation_id = (
            reading.installation_id
            or (plant_map.get(reading.plant_id).installation_id if reading.plant_id in plant_map else None)
            or device_installations.get(reading.device_id)
        )
        installation_name = installation_map.get(installation_id).name if installation_id in installation_map else None

        device = device_map.get(reading.device_id)
        plant = plant_map.get(reading.plant_id)

        items.append(
            {
                'id': reading.id,
                'ts': reading.ts,
                'created_on': reading.created_on,
                'client_id': reading.client_id,
                'installation_id': installation_id,
                'installation_name': installation_name,
                'device_id': reading.device_id,
                'device_name': device.name if device else None,
                'plant_id': reading.plant_id,
                'plant_name': plant.name if plant else None,
                'status': device.status if device else None,
                'temp_c': values.get('TEMP_C'),
                'hum_air': values.get('HUM_AIR'),
                'soil_percent': values.get('SOIL_PERCENT'),
                'ldr_raw': values.get('LDR_RAW'),
                'rain': values.get('RAIN'),
                'rssi': int(values.get('RSSI')) if values.get('RSSI') is not None else None,
            }
        )

    return items
