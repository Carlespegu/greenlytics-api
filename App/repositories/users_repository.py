from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from database.models.clients import Client
from database.models.roles import Role
from database.models.users import User


def get_all_users(
    db: Session,
    client_id: UUID | None = None,
    is_active: bool | None = None,
    email: str | None = None,
    username: str | None = None,
    first_name: str | None = None,
    last_name: str | None = None,
):
    query = db.query(User).filter(User.is_deleted == False)  # noqa: E712

    if client_id:
        query = query.filter(User.client_id == client_id)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if email:
        query = query.filter(User.email.ilike(f"%{email}%"))
    if username:
        query = query.filter(User.username.ilike(f"%{username}%"))
    if first_name:
        query = query.filter(User.first_name.ilike(f"%{first_name}%"))
    if last_name:
        query = query.filter(User.last_name.ilike(f"%{last_name}%"))

    return query.order_by(User.username.asc()).all()


def get_user_by_id(db: Session, user_id: UUID):
    return (
        db.query(User)
        .filter(User.id == user_id, User.is_deleted == False)  # noqa: E712
        .first()
    )


def get_user_by_username(db: Session, username: str):
    return (
        db.query(User)
        .filter(User.username == username, User.is_deleted == False)  # noqa: E712
        .first()
    )


def get_user_by_email(db: Session, email: str):
    return (
        db.query(User)
        .filter(User.email == email, User.is_deleted == False)  # noqa: E712
        .first()
    )


def get_user_by_email_for_client(db: Session, client_id: UUID, email: str):
    return (
        db.query(User)
        .filter(
            User.client_id == client_id,
            User.email == email,
            User.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def create_user(db: Session, user: User):
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User):
    db.commit()
    db.refresh(user)
    return user


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


def _apply_search_filters(query, payload):
    if payload.username is not None:
        query = _apply_string_filter(query, User.username, payload.username)

    if payload.email is not None:
        query = _apply_string_filter(query, User.email, payload.email)

    if payload.first_name is not None:
        query = _apply_string_filter(query, User.first_name, payload.first_name)

    if payload.last_name is not None:
        query = _apply_string_filter(query, User.last_name, payload.last_name)

    if payload.is_active is not None:
        query = _apply_boolean_filter(query, User.is_active, payload.is_active)

    if payload.client_id is not None:
        query = _apply_uuid_filter(query, User.client_id, payload.client_id)

    if payload.role_id is not None:
        query = _apply_uuid_filter(query, User.role_id, payload.role_id)

    return query


def _map_user_search_item(row):
    user, client_code, client_name, role_code, role_name = row
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "client_id": user.client_id,
        "role_id": user.role_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "is_active": user.is_active,
        "created_on": user.created_on,
        "modified_on": user.modified_on,
        "deleted_on": user.deleted_on,
        "is_deleted": user.is_deleted,
        "client_code": client_code,
        "client_name": client_name,
        "role_code": role_code,
        "role_name": role_name,
    }


def search_users(db: Session, payload):
    query = (
        db.query(
            User,
            Client.code.label("client_code"),
            Client.name.label("client_name"),
            Role.code.label("role_code"),
            Role.name.label("role_name"),
        )
        .outerjoin(Client, User.client_id == Client.id)
        .outerjoin(Role, User.role_id == Role.id)
        .filter(User.is_deleted == False)  # noqa: E712
    )

    query = _apply_search_filters(query, payload)

    total_query = db.query(func.count(User.id)).select_from(User).filter(User.is_deleted == False)  # noqa: E712
    total_query = _apply_search_filters(total_query, payload)
    total = total_query.scalar() or 0

    sortable_columns = {
        "username": User.username,
        "email": User.email,
        "first_name": User.first_name,
        "last_name": User.last_name,
        "is_active": User.is_active,
        "created_on": User.created_on,
        "client_code": Client.code,
        "client_name": Client.name,
        "role_code": Role.code,
        "role_name": Role.name,
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
        query = query.order_by(User.username.asc())

    page = payload.pagination_params.page
    page_size = payload.pagination_params.page_size
    offset = (page - 1) * page_size

    rows = query.offset(offset).limit(page_size).all()
    items = [_map_user_search_item(row) for row in rows]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
