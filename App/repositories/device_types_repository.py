from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session
from database.models.device_type import DeviceType


def get_all_device_types(db: Session):
    return (
        db.query(DeviceType)
        .filter(DeviceType.is_deleted == False)  # noqa: E712
        .order_by(DeviceType.name.asc())
        .all()
    )


def get_device_type_by_id(db: Session, device_type_id: UUID):
    return (
        db.query(DeviceType)
        .filter(DeviceType.id == device_type_id, DeviceType.is_deleted == False)  # noqa: E712
        .first()
    )


def get_device_type_by_code(db: Session, code: str):
    return (
        db.query(DeviceType)
        .filter(DeviceType.code == code, DeviceType.is_deleted == False)  # noqa: E712
        .first()
    )


def create_device_type(db: Session, device_type: DeviceType):
    db.add(device_type)
    db.commit()
    db.refresh(device_type)
    return device_type


def update_device_type(db: Session, device_type: DeviceType):
    db.commit()
    db.refresh(device_type)
    return device_type


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


def search_device_types(db: Session, payload):
    query = db.query(DeviceType).filter(DeviceType.is_deleted == False)  # noqa: E712

    if payload.code is not None:
        query = _apply_string_filter(query, DeviceType.code, payload.code)

    if payload.name is not None:
        query = _apply_string_filter(query, DeviceType.name, payload.name)

    if payload.description is not None:
        query = _apply_string_filter(query, DeviceType.description, payload.description)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, DeviceType.is_active, payload.is_active)

    total = query.with_entities(func.count(DeviceType.id)).scalar() or 0

    sortable_columns = {
        "code": DeviceType.code,
        "name": DeviceType.name,
        "is_active": DeviceType.is_active,
        "created_on": DeviceType.created_on,
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
        query = query.order_by(DeviceType.name.asc())

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


def search_device_type_combo(
    db: Session,
    query_text: str | None = None,
    page: int = 1,
    page_size: int = 10,
):
    query = db.query(DeviceType).filter(DeviceType.is_deleted == False)  # noqa: E712

    safe_query = (query_text or "").strip()
    if safe_query:
        ilike_value = f"%{safe_query}%"
        query = query.filter(
            (DeviceType.name.ilike(ilike_value)) |
            (DeviceType.code.ilike(ilike_value))
        )

    total = query.count()
    items = (
        query.order_by(DeviceType.name.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
