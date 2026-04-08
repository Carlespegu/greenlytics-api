from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from database.models.plant_threshold import PlantThreshold
from database.models.reading import Reading
from database.models.reading_type import ReadingType
from database.models.reading_value import ReadingValue


def get_plant_threshold_by_id(db: Session, threshold_id: UUID):
    return (
        db.query(PlantThreshold)
        .filter(PlantThreshold.id == threshold_id, PlantThreshold.is_deleted == False)  # noqa: E712
        .first()
    )


def get_plant_threshold_by_plant_and_reading_type(
    db: Session,
    plant_id: UUID,
    reading_type_id: UUID,
):
    return (
        db.query(PlantThreshold)
        .filter(
            PlantThreshold.plant_id == plant_id,
            PlantThreshold.reading_type_id == reading_type_id,
            PlantThreshold.is_deleted == False,  # noqa: E712
        )
        .first()
    )


def list_thresholds_by_plant_id(db: Session, plant_id: UUID):
    return (
        db.query(PlantThreshold)
        .filter(
            PlantThreshold.plant_id == plant_id,
            PlantThreshold.is_deleted == False,  # noqa: E712
        )
        .order_by(PlantThreshold.created_on.asc())
        .all()
    )


def create_plant_threshold(db: Session, threshold: PlantThreshold):
    db.add(threshold)
    db.commit()
    db.refresh(threshold)
    return threshold


def update_plant_threshold(db: Session, threshold: PlantThreshold):
    db.commit()
    db.refresh(threshold)
    return threshold


def _apply_uuid_filter(query, column, filter_obj):
    comparator = (filter_obj.comparator or "equals").lower()
    if comparator != "equals":
        raise ValueError(f"Unsupported UUID comparator: {filter_obj.comparator}")
    return query.filter(column == filter_obj.filter_value)


def _apply_boolean_filter(query, column, filter_obj):
    comparator = (filter_obj.comparator or "equals").lower()
    if comparator != "equals":
        raise ValueError(f"Unsupported boolean comparator: {filter_obj.comparator}")
    return query.filter(column == filter_obj.filter_value)


def _apply_numeric_filter(query, column, filter_obj):
    comparator = (filter_obj.comparator or "equals").lower()
    value = filter_obj.filter_value
    if comparator == "equals":
        return query.filter(column == value)
    if comparator == "gte":
        return query.filter(column >= value)
    if comparator == "lte":
        return query.filter(column <= value)
    raise ValueError(f"Unsupported numeric comparator: {filter_obj.comparator}")


def search_plant_thresholds(db: Session, payload):
    query = (
        db.query(
            PlantThreshold,
            ReadingType.code.label("reading_type_code"),
            ReadingType.name.label("reading_type_name"),
            ReadingType.unit.label("reading_type_unit"),
        )
        .outerjoin(ReadingType, ReadingType.id == PlantThreshold.reading_type_id)
        .filter(PlantThreshold.is_deleted == False)  # noqa: E712
    )

    if payload.plant_id is not None:
        query = _apply_uuid_filter(query, PlantThreshold.plant_id, payload.plant_id)
    if payload.reading_type_id is not None:
        query = _apply_uuid_filter(query, PlantThreshold.reading_type_id, payload.reading_type_id)
    if payload.is_active is not None:
        query = _apply_boolean_filter(query, PlantThreshold.is_active, payload.is_active)
    if payload.min_value is not None:
        query = _apply_numeric_filter(query, PlantThreshold.min_value, payload.min_value)
    if payload.max_value is not None:
        query = _apply_numeric_filter(query, PlantThreshold.max_value, payload.max_value)

    total = (
        query.with_entities(func.count(PlantThreshold.id))
        .order_by(None)
        .scalar()
        or 0
    )

    sortable_columns = {
        "created_on": PlantThreshold.created_on,
        "min_value": PlantThreshold.min_value,
        "max_value": PlantThreshold.max_value,
        "reading_type_code": ReadingType.code,
    }

    if payload.sorting_params:
        for sort in payload.sorting_params:
            column = sortable_columns.get(sort.sort_by)
            if column is None:
                continue
            query = query.order_by(column.desc() if sort.sort_direction.lower() == "desc" else column.asc())
    else:
        query = query.order_by(ReadingType.code.asc(), PlantThreshold.created_on.asc())

    page = payload.pagination_params.page
    page_size = payload.pagination_params.page_size
    offset = (page - 1) * page_size
    rows = query.offset(offset).limit(page_size).all()

    items = []
    for row in rows:
        threshold = row[0]
        items.append(
            {
                "id": threshold.id,
                "plant_id": threshold.plant_id,
                "reading_type_id": threshold.reading_type_id,
                "min_value": threshold.min_value,
                "max_value": threshold.max_value,
                "optimal_min_value": threshold.optimal_min_value,
                "optimal_max_value": threshold.optimal_max_value,
                "unit": threshold.unit,
                "severity_below": threshold.severity_below,
                "severity_above": threshold.severity_above,
                "notes": threshold.notes,
                "source": threshold.source,
                "is_active": threshold.is_active,
                "created_on": threshold.created_on,
                "created_by": threshold.created_by,
                "modified_on": threshold.modified_on,
                "modified_by": threshold.modified_by,
                "deleted_on": threshold.deleted_on,
                "is_deleted": threshold.is_deleted,
                "reading_type_code": row.reading_type_code,
                "reading_type_name": row.reading_type_name,
                "reading_type_unit": row.reading_type_unit,
            }
        )

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


def list_latest_values_for_plant(db: Session, plant_id: UUID):
    rows = (
        db.query(
            ReadingValue.reading_type_id,
            ReadingType.code.label("reading_type_code"),
            ReadingType.name.label("reading_type_name"),
            ReadingType.unit.label("reading_type_unit"),
            Reading.id.label("reading_id"),
            Reading.ts.label("reading_ts"),
            ReadingValue.value_decimal,
            ReadingValue.value_integer,
            ReadingValue.value_text,
            ReadingValue.value_boolean,
        )
        .join(Reading, Reading.id == ReadingValue.reading_id)
        .join(ReadingType, ReadingType.id == ReadingValue.reading_type_id)
        .filter(Reading.plant_id == plant_id)
        .order_by(Reading.ts.desc())
        .all()
    )

    latest_by_type = {}
    for row in rows:
        key = str(row.reading_type_id)
        if key in latest_by_type:
            continue
        latest_by_type[key] = row

    return latest_by_type


def coerce_latest_numeric_value(row) -> Decimal | None:
    if row is None:
        return None
    if row.value_decimal is not None:
        return Decimal(row.value_decimal)
    if row.value_integer is not None:
        return Decimal(row.value_integer)
    return None
