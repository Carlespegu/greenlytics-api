from sqlalchemy import func
from sqlalchemy.orm import Session
from uuid import UUID

from database.models.clients import Client


def get_all_clients(db: Session):
    return (
        db.query(Client)
        .filter(Client.is_deleted == False)  # noqa: E712
        .order_by(Client.created_on.desc())
        .all()
    )


def get_client_by_id(db: Session, client_id: UUID):
    return (
        db.query(Client)
        .filter(Client.id == client_id, Client.is_deleted == False)  # noqa: E712
        .first()
    )


def get_client_by_code(db: Session, code: str):
    return (
        db.query(Client)
        .filter(Client.code == code, Client.is_deleted == False)  # noqa: E712
        .first()
    )


def get_client_by_api_key(db: Session, api_key: str):
    return (
        db.query(Client)
        .filter(Client.api_key == api_key, Client.is_deleted == False)  # noqa: E712
        .first()
    )


def create_client(db: Session, client: Client):
    db.add(client)
    db.commit()
    db.refresh(client)
    return client


def update_client(db: Session, client: Client):
    db.commit()
    db.refresh(client)
    return client


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


def search_clients(db: Session, payload):
    query = db.query(Client).filter(Client.is_deleted == False)  # noqa: E712

    if payload.code is not None:
        query = _apply_string_filter(query, Client.code, payload.code)

    if payload.name is not None:
        query = _apply_string_filter(query, Client.name, payload.name)

    if payload.trade_name is not None:
        query = _apply_string_filter(query, Client.trade_name, payload.trade_name)

    if payload.tax_id is not None:
        query = _apply_string_filter(query, Client.tax_id, payload.tax_id)

    if payload.email is not None:
        query = _apply_string_filter(query, Client.email, payload.email)

    if payload.phone is not None:
        query = _apply_string_filter(query, Client.phone, payload.phone)

    if payload.city is not None:
        query = _apply_string_filter(query, Client.city, payload.city)

    if payload.country is not None:
        query = _apply_string_filter(query, Client.country, payload.country)

    if payload.client_type is not None:
        query = _apply_string_filter(query, Client.client_type, payload.client_type)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, Client.is_active, payload.is_active)

    total = query.with_entities(func.count(Client.id)).scalar() or 0

    sortable_columns = {
        "code": Client.code,
        "name": Client.name,
        "trade_name": Client.trade_name,
        "email": Client.email,
        "city": Client.city,
        "country": Client.country,
        "client_type": Client.client_type,
        "is_active": Client.is_active,
        "created_on": Client.created_on,
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
        query = query.order_by(Client.name.asc())

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
