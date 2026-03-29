from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.models.installation_device import InstallationDevice


def get_all_installation_devices(db: Session):
    return (
        db.query(InstallationDevice)
        .order_by(InstallationDevice.created_on.desc())
        .all()
    )


def get_installation_device_by_id(db: Session, installation_device_id: UUID):
    return (
        db.query(InstallationDevice)
        .filter(InstallationDevice.id == installation_device_id)
        .first()
    )


def get_active_assignment_by_device_id(db: Session, device_id: UUID):
    return (
        db.query(InstallationDevice)
        .filter(
            InstallationDevice.device_id == device_id,
            InstallationDevice.is_active == True,  # noqa: E712
        )
        .first()
    )


def create_installation_device(db: Session, installation_device: InstallationDevice):
    db.add(installation_device)
    db.commit()
    db.refresh(installation_device)
    return installation_device


def update_installation_device(db: Session, installation_device: InstallationDevice):
    db.commit()
    db.refresh(installation_device)
    return installation_device


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


def search_installation_devices(db: Session, payload):
    query = db.query(InstallationDevice)

    if payload.installation_id is not None:
        query = _apply_uuid_filter(query, InstallationDevice.installation_id, payload.installation_id)

    if payload.device_id is not None:
        query = _apply_uuid_filter(query, InstallationDevice.device_id, payload.device_id)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, InstallationDevice.is_active, payload.is_active)

    total = query.with_entities(func.count(InstallationDevice.id)).scalar() or 0

    sortable_columns = {
        "assigned_on": InstallationDevice.assigned_on,
        "unassigned_on": InstallationDevice.unassigned_on,
        "is_active": InstallationDevice.is_active,
        "created_on": InstallationDevice.created_on,
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
        query = query.order_by(InstallationDevice.created_on.desc())

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
