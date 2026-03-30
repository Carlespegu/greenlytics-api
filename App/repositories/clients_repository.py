from uuid import UUID

from sqlalchemy.orm import Session

from database.models.clients import Client


def get_all_clients(db: Session):
    return (
        db.query(Client)
        .filter(Client.is_deleted == False)  # noqa: E712
        .order_by(Client.name.asc())
        .all()
    )


def get_client_by_id(db: Session, client_id: UUID):
    return (
        db.query(Client)
        .filter(
            Client.id == client_id,
            Client.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def get_client_by_code(db: Session, code: str):
    return (
        db.query(Client)
        .filter(
            Client.code == code,
            Client.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def get_client_by_api_key(db: Session, api_key: str):
    return (
        db.query(Client)
        .filter(
            Client.api_key == api_key,
            Client.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def get_client_by_email(db: Session, email: str):
    return (
        db.query(Client)
        .filter(
            Client.email == email,
            Client.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def get_client_by_tax_id(db: Session, tax_id: str):
    return (
        db.query(Client)
        .filter(
            Client.tax_id == tax_id,
            Client.is_deleted == False,  # noqa: E712
        )
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


def search_clients(db: Session, payload):
    query = db.query(Client).filter(Client.is_deleted == False)  # noqa: E712

    if getattr(payload, "code", None) and payload.code.filter_value:
        query = query.filter(Client.code.ilike(f"%{payload.code.filter_value}%"))

    if getattr(payload, "name", None) and payload.name.filter_value:
        query = query.filter(Client.name.ilike(f"%{payload.name.filter_value}%"))

    if getattr(payload, "trade_name", None) and payload.trade_name.filter_value:
        query = query.filter(Client.trade_name.ilike(f"%{payload.trade_name.filter_value}%"))

    if getattr(payload, "email", None) and payload.email.filter_value:
        query = query.filter(Client.email.ilike(f"%{payload.email.filter_value}%"))

    if getattr(payload, "city", None) and payload.city.filter_value:
        query = query.filter(Client.city.ilike(f"%{payload.city.filter_value}%"))

    if getattr(payload, "country", None) and payload.country.filter_value:
        query = query.filter(Client.country.ilike(f"%{payload.country.filter_value}%"))

    if getattr(payload, "client_type", None) and payload.client_type.filter_value:
        query = query.filter(Client.client_type.ilike(f"%{payload.client_type.filter_value}%"))

    if getattr(payload, "is_active", None) and payload.is_active.filter_value is not None:
        query = query.filter(Client.is_active == payload.is_active.filter_value)

    total = query.count()

    sorting_params = getattr(payload, "sorting_params", None) or []
    for sorting in sorting_params:
        sort_by = getattr(sorting, "sort_by", None)
        sort_direction = getattr(sorting, "sort_direction", "asc")

        if hasattr(Client, sort_by):
            column = getattr(Client, sort_by)
            query = query.order_by(column.desc() if sort_direction == "desc" else column.asc())

    pagination = getattr(payload, "pagination_params", None)
    page = getattr(pagination, "page", 1) or 1
    page_size = getattr(pagination, "page_size", 10) or 10

    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }