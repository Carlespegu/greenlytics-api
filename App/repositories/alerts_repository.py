from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from database.models.alert import Alert
from database.models.clients import Client
from database.models.installation import Installation
from database.models.plant import Plant
from database.models.reading_type import ReadingType


def get_all_alerts(db: Session):
    return (
        db.query(Alert)
        .filter(Alert.is_deleted == False)  # noqa: E712
        .order_by(Alert.name.asc())
        .all()
    )


def get_alert_by_id(db: Session, alert_id: UUID):
    return (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.is_deleted == False)  # noqa: E712
        .first()
    )


def create_alert(db: Session, alert: Alert):
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def update_alert(db: Session, alert: Alert):
    db.commit()
    db.refresh(alert)
    return alert


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


def search_alerts(db: Session, payload):
    base_query = (
        db.query(
            Alert.id.label("id"),
            Alert.client_id.label("client_id"),
            Client.code.label("client_code"),
            Client.name.label("client_name"),
            Alert.installation_id.label("installation_id"),
            Installation.code.label("installation_code"),
            Installation.name.label("installation_name"),
            Alert.plant_id.label("plant_id"),
            Plant.code.label("plant_code"),
            Plant.name.label("plant_name"),
            Alert.reading_type_id.label("reading_type_id"),
            ReadingType.code.label("reading_type_code"),
            ReadingType.name.label("reading_type_name"),
            ReadingType.value_type.label("reading_type_value_type"),
            Alert.name.label("name"),
            Alert.description.label("description"),
            Alert.channel.label("channel"),
            Alert.recipient_email.label("recipient_email"),
            Alert.condition_type.label("condition_type"),
            Alert.min_value.label("min_value"),
            Alert.max_value.label("max_value"),
            Alert.exact_numeric_value.label("exact_numeric_value"),
            Alert.exact_text_value.label("exact_text_value"),
            Alert.exact_boolean_value.label("exact_boolean_value"),
            Alert.is_active.label("is_active"),
        )
        .join(Client, Client.id == Alert.client_id)
        .outerjoin(Installation, Installation.id == Alert.installation_id)
        .outerjoin(Plant, Plant.id == Alert.plant_id)
        .join(ReadingType, ReadingType.id == Alert.reading_type_id)
        .filter(Alert.is_deleted == False)  # noqa: E712
    )

    if payload.client_id is not None:
        base_query = _apply_uuid_filter(base_query, Alert.client_id, payload.client_id)
    if payload.installation_id is not None:
        base_query = _apply_uuid_filter(base_query, Alert.installation_id, payload.installation_id)
    if payload.plant_id is not None:
        base_query = _apply_uuid_filter(base_query, Alert.plant_id, payload.plant_id)
    if payload.reading_type_id is not None:
        base_query = _apply_uuid_filter(base_query, Alert.reading_type_id, payload.reading_type_id)

    if payload.name is not None:
        base_query = _apply_string_filter(base_query, Alert.name, payload.name)
    if payload.channel is not None:
        base_query = _apply_string_filter(base_query, Alert.channel, payload.channel)
    if payload.recipient_email is not None:
        base_query = _apply_string_filter(base_query, Alert.recipient_email, payload.recipient_email)
    if payload.condition_type is not None:
        base_query = _apply_string_filter(base_query, Alert.condition_type, payload.condition_type)
    if payload.is_active is not None:
        base_query = _apply_boolean_filter(base_query, Alert.is_active, payload.is_active)

    if payload.client_name is not None:
        base_query = _apply_string_filter(base_query, Client.name, payload.client_name)
    if payload.installation_name is not None:
        base_query = _apply_string_filter(base_query, Installation.name, payload.installation_name)
    if payload.plant_name is not None:
        base_query = _apply_string_filter(base_query, Plant.name, payload.plant_name)
    if payload.reading_type_name is not None:
        base_query = _apply_string_filter(base_query, ReadingType.name, payload.reading_type_name)

    count_query = (
        db.query(func.count(Alert.id))
        .join(Client, Client.id == Alert.client_id)
        .outerjoin(Installation, Installation.id == Alert.installation_id)
        .outerjoin(Plant, Plant.id == Alert.plant_id)
        .join(ReadingType, ReadingType.id == Alert.reading_type_id)
        .filter(Alert.is_deleted == False)  # noqa: E712
    )

    if payload.client_id is not None:
        count_query = _apply_uuid_filter(count_query, Alert.client_id, payload.client_id)
    if payload.installation_id is not None:
        count_query = _apply_uuid_filter(count_query, Alert.installation_id, payload.installation_id)
    if payload.plant_id is not None:
        count_query = _apply_uuid_filter(count_query, Alert.plant_id, payload.plant_id)
    if payload.reading_type_id is not None:
        count_query = _apply_uuid_filter(count_query, Alert.reading_type_id, payload.reading_type_id)
    if payload.name is not None:
        count_query = _apply_string_filter(count_query, Alert.name, payload.name)
    if payload.channel is not None:
        count_query = _apply_string_filter(count_query, Alert.channel, payload.channel)
    if payload.recipient_email is not None:
        count_query = _apply_string_filter(count_query, Alert.recipient_email, payload.recipient_email)
    if payload.condition_type is not None:
        count_query = _apply_string_filter(count_query, Alert.condition_type, payload.condition_type)
    if payload.is_active is not None:
        count_query = _apply_boolean_filter(count_query, Alert.is_active, payload.is_active)
    if payload.client_name is not None:
        count_query = _apply_string_filter(count_query, Client.name, payload.client_name)
    if payload.installation_name is not None:
        count_query = _apply_string_filter(count_query, Installation.name, payload.installation_name)
    if payload.plant_name is not None:
        count_query = _apply_string_filter(count_query, Plant.name, payload.plant_name)
    if payload.reading_type_name is not None:
        count_query = _apply_string_filter(count_query, ReadingType.name, payload.reading_type_name)

    total = count_query.scalar() or 0

    sortable_columns = {
        "name": Alert.name,
        "client_name": Client.name,
        "installation_name": Installation.name,
        "plant_name": Plant.name,
        "reading_type_name": ReadingType.name,
        "channel": Alert.channel,
        "condition_type": Alert.condition_type,
        "is_active": Alert.is_active,
        "created_on": Alert.created_on,
    }

    if payload.sorting_params:
        for sort in payload.sorting_params:
            column = sortable_columns.get(sort.sort_by)
            if column is None:
                continue
            if sort.sort_direction.lower() == "desc":
                base_query = base_query.order_by(column.desc())
            else:
                base_query = base_query.order_by(column.asc())
    else:
        base_query = base_query.order_by(Alert.name.asc())

    page = payload.pagination_params.page
    page_size = payload.pagination_params.page_size
    offset = (page - 1) * page_size

    rows = base_query.offset(offset).limit(page_size).all()
    items = [dict(row._mapping) for row in rows]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
