from uuid import UUID
from sqlalchemy import and_, exists, func
from sqlalchemy.orm import Session

from database.models.device import Device
from database.models.installation import Installation
from database.models.installation_device import InstallationDevice


def _apply_client_scope(query, client_id):
    if client_id is None:
        return query

    return query.filter(
        exists().where(
            and_(
                InstallationDevice.device_id == Device.id,
                InstallationDevice.is_active == True,  # noqa: E712
                InstallationDevice.installation_id == Installation.id,
                Installation.client_id == client_id,
                Installation.is_deleted == False,  # noqa: E712
            )
        )
    )


def get_all_devices(db: Session, client_id=None):
    query = db.query(Device).filter(Device.is_deleted == False)  # noqa: E712
    query = _apply_client_scope(query, client_id)
    return query.order_by(Device.name.asc()).all()


def get_device_by_id(db: Session, device_id: UUID, client_id=None):
    query = db.query(Device).filter(Device.id == device_id, Device.is_deleted == False)  # noqa: E712
    query = _apply_client_scope(query, client_id)
    return query.first()


def get_device_by_code(db: Session, code: str):
    return (
        db.query(Device)
        .filter(Device.code == code, Device.is_deleted == False)  # noqa: E712
        .first()
    )


def get_device_by_api_key(db: Session, api_key: str):
    return (
        db.query(Device)
        .filter(Device.api_key == api_key, Device.is_deleted == False)  # noqa: E712
        .first()
    )


def create_device(db: Session, device: Device):
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


def update_device(db: Session, device: Device):
    db.commit()
    db.refresh(device)
    return device


def _apply_string_filter(query, column, filter_obj):
    comparator = (filter_obj.comparator or "contains").lower()
    value = filter_obj.filter_value

    if comparator == "equals":
        return query.filter(column == value)
    if comparator == "contains":
        return query.filter(column.ilike(f"%{value}%"))
    if comparator == "starts_with":
        return query.filter(column.ilike(f"{value}%"))
    if comparator == "ends_with":
        return query.filter(column.ilike(f"%{value}"))
    raise ValueError(f"Unsupported string comparator: {filter_obj.comparator}")


def _apply_boolean_filter(query, column, filter_obj):
    comparator = (filter_obj.comparator or "equals").lower()
    if comparator != "equals":
        raise ValueError(f"Unsupported boolean comparator: {filter_obj.comparator}")
    return query.filter(column == filter_obj.filter_value)


def _apply_uuid_filter(query, column, filter_obj):
    comparator = (filter_obj.comparator or "equals").lower()
    if comparator != "equals":
        raise ValueError(f"Unsupported UUID comparator: {filter_obj.comparator}")
    return query.filter(column == filter_obj.filter_value)


def search_devices(db: Session, payload, client_id=None):
    query = db.query(Device).filter(Device.is_deleted == False)  # noqa: E712
    query = _apply_client_scope(query, client_id)

    if payload.client_ids:
        query = query.filter(
            exists().where(
                and_(
                    InstallationDevice.device_id == Device.id,
                    InstallationDevice.is_active == True,  # noqa: E712
                    InstallationDevice.installation_id == Installation.id,
                    Installation.client_id.in_(payload.client_ids),
                    Installation.is_deleted == False,  # noqa: E712
                )
            )
        )

    if payload.device_type_ids:
        query = query.filter(Device.device_type_id.in_(payload.device_type_ids))

    if payload.device_type_id is not None:
        query = _apply_uuid_filter(query, Device.device_type_id, payload.device_type_id)

    if payload.code is not None:
        query = _apply_string_filter(query, Device.code, payload.code)

    if payload.name is not None:
        query = _apply_string_filter(query, Device.name, payload.name)

    if payload.description is not None:
        query = _apply_string_filter(query, Device.description, payload.description)

    if payload.serial_number is not None:
        query = _apply_string_filter(query, Device.serial_number, payload.serial_number)

    if payload.mac_address is not None:
        query = _apply_string_filter(query, Device.mac_address, payload.mac_address)

    if payload.firmware_version is not None:
        query = _apply_string_filter(query, Device.firmware_version, payload.firmware_version)

    if payload.hardware_version is not None:
        query = _apply_string_filter(query, Device.hardware_version, payload.hardware_version)

    if payload.wifi_name is not None:
        query = _apply_string_filter(query, Device.wifi_name, payload.wifi_name)

    if payload.status is not None:
        query = _apply_string_filter(query, Device.status, payload.status)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, Device.is_active, payload.is_active)

    total = query.with_entities(func.count(Device.id)).scalar() or 0

    sortable_columns = {
        "code": Device.code,
        "name": Device.name,
        "serial_number": Device.serial_number,
        "mac_address": Device.mac_address,
        "firmware_version": Device.firmware_version,
        "hardware_version": Device.hardware_version,
        "status": Device.status,
        "last_seen_on": Device.last_seen_on,
        "is_active": Device.is_active,
        "created_on": Device.created_on,
    }

    if payload.sorting_params:
        for sort in payload.sorting_params:
            column = sortable_columns.get(sort.sort_by)
            if column is None:
                continue
            if sort.sort_direction.lower() == "desc":
                query = query.order_by(column.desc())
            else:
                query = query.order_by(column.asc())
    else:
        query = query.order_by(Device.name.asc())

    page = payload.pagination_params.page
    page_size = payload.pagination_params.page_size
    offset = (page - 1) * page_size

    items = query.offset(offset).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
