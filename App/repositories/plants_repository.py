from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.models.plant import Plant


def get_all_plants(db: Session):
    return (
        db.query(Plant)
        .filter(Plant.is_deleted == False)  # noqa: E712
        .order_by(Plant.name.asc())
        .all()
    )


def get_plant_by_id(db: Session, plant_id: UUID):
    return (
        db.query(Plant)
        .filter(Plant.id == plant_id, Plant.is_deleted == False)  # noqa: E712
        .first()
    )


def get_plant_by_client_and_code(db: Session, client_id: UUID, code: str):
    return (
        db.query(Plant)
        .filter(
            Plant.client_id == client_id,
            Plant.code == code,
            Plant.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def create_plant(db: Session, plant: Plant):
    db.add(plant)
    db.commit()
    db.refresh(plant)
    return plant


def update_plant(db: Session, plant: Plant):
    db.commit()
    db.refresh(plant)
    return plant


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


def search_plants(db: Session, payload):
    query = db.query(Plant).filter(Plant.is_deleted == False)  # noqa: E712

    if payload.client_id is not None:
        query = _apply_uuid_filter(query, Plant.client_id, payload.client_id)

    if payload.installation_id is not None:
        query = _apply_uuid_filter(query, Plant.installation_id, payload.installation_id)

    if payload.code is not None:
        query = _apply_string_filter(query, Plant.code, payload.code)

    if payload.name is not None:
        query = _apply_string_filter(query, Plant.name, payload.name)

    if payload.common_name is not None:
        query = _apply_string_filter(query, Plant.common_name, payload.common_name)

    if payload.scientific_name is not None:
        query = _apply_string_filter(query, Plant.scientific_name, payload.scientific_name)

    if payload.plant_type is not None:
        query = _apply_string_filter(query, Plant.plant_type, payload.plant_type)

    if payload.planting_type is not None:
        query = _apply_string_filter(query, Plant.planting_type, payload.planting_type)

    if payload.location_type is not None:
        query = _apply_string_filter(query, Plant.location_type, payload.location_type)

    if payload.sun_exposure is not None:
        query = _apply_string_filter(query, Plant.sun_exposure, payload.sun_exposure)

    if payload.status is not None:
        query = _apply_string_filter(query, Plant.status, payload.status)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, Plant.is_active, payload.is_active)

    total = query.with_entities(func.count(Plant.id)).scalar() or 0

    sortable_columns = {
        "code": Plant.code,
        "name": Plant.name,
        "common_name": Plant.common_name,
        "scientific_name": Plant.scientific_name,
        "plant_type": Plant.plant_type,
        "planting_type": Plant.planting_type,
        "location_type": Plant.location_type,
        "status": Plant.status,
        "created_on": Plant.created_on,
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
        query = query.order_by(Plant.name.asc())

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
