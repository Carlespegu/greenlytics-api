from uuid import UUID
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.models.installation import Installation


def get_all_installations(db: Session):
    return (
        db.query(Installation)
        .filter(Installation.is_deleted == False)  # noqa: E712
        .order_by(Installation.name.asc())
        .all()
    )


def get_installation_by_id(db: Session, installation_id: UUID):
    return (
        db.query(Installation)
        .filter(Installation.id == installation_id, Installation.is_deleted == False)  # noqa: E712
        .first()
    )


def get_installation_by_client_and_code(db: Session, client_id: UUID, code: str):
    return (
        db.query(Installation)
        .filter(
            Installation.client_id == client_id,
            Installation.code == code,
            Installation.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def create_installation(db: Session, installation: Installation):
    db.add(installation)
    db.commit()
    db.refresh(installation)
    return installation


def update_installation(db: Session, installation: Installation):
    db.commit()
    db.refresh(installation)
    return installation


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


def search_installations(db: Session, payload):
    query = db.query(Installation).filter(Installation.is_deleted == False)  # noqa: E712

    if payload.client_id is not None:
        query = _apply_uuid_filter(query, Installation.client_id, payload.client_id)

    if payload.code is not None:
        query = _apply_string_filter(query, Installation.code, payload.code)

    if payload.name is not None:
        query = _apply_string_filter(query, Installation.name, payload.name)

    if payload.description is not None:
        query = _apply_string_filter(query, Installation.description, payload.description)

    if payload.address is not None:
        query = _apply_string_filter(query, Installation.address, payload.address)

    if payload.city is not None:
        query = _apply_string_filter(query, Installation.city, payload.city)

    if payload.state is not None:
        query = _apply_string_filter(query, Installation.state, payload.state)

    if payload.postal_code is not None:
        query = _apply_string_filter(query, Installation.postal_code, payload.postal_code)

    if payload.country is not None:
        query = _apply_string_filter(query, Installation.country, payload.country)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, Installation.is_active, payload.is_active)

    total = query.with_entities(func.count(Installation.id)).scalar() or 0

    sortable_columns = {
        "code": Installation.code,
        "name": Installation.name,
        "city": Installation.city,
        "state": Installation.state,
        "country": Installation.country,
        "is_active": Installation.is_active,
        "created_on": Installation.created_on,
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
        query = query.order_by(Installation.name.asc())

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
