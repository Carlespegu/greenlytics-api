from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.plant_thresholds_repository import (
    coerce_latest_numeric_value,
    create_plant_threshold,
    get_plant_threshold_by_id,
    get_plant_threshold_by_plant_and_reading_type,
    list_latest_values_for_plant,
    list_thresholds_by_plant_id,
    search_plant_thresholds,
    update_plant_threshold,
)
from App.repositories.plants_repository import get_plant_by_id
from App.repositories.reading_types_repository import get_reading_type_by_id
from App.schemas.plant_thresholds import (
    PlantHealthMetricResponse,
    PlantHealthSummaryResponse,
    PlantThresholdCreate,
    PlantThresholdUpdate,
)
from database.models.plant_threshold import PlantThreshold


def list_plant_thresholds_service(db: Session, plant_id: UUID):
    return list_thresholds_by_plant_id(db, plant_id)


def search_plant_thresholds_service(db: Session, payload):
    try:
        return search_plant_thresholds(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


def get_plant_threshold_service(db: Session, threshold_id: UUID):
    threshold = get_plant_threshold_by_id(db, threshold_id)
    if not threshold:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant threshold not found")
    return threshold


def _validate_threshold_payload(db: Session, plant_id: UUID, reading_type_id: UUID, threshold_id: UUID | None = None):
    plant = get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")

    reading_type = get_reading_type_by_id(db, reading_type_id)
    if not reading_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reading type not found")

    existing = get_plant_threshold_by_plant_and_reading_type(db, plant_id, reading_type_id)
    if existing and existing.id != threshold_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A threshold already exists for this plant and reading type",
        )

    return plant, reading_type


def create_plant_threshold_service(db: Session, payload: PlantThresholdCreate):
    _validate_threshold_payload(db, payload.plant_id, payload.reading_type_id)

    threshold = PlantThreshold(
        plant_id=payload.plant_id,
        reading_type_id=payload.reading_type_id,
        min_value=payload.min_value,
        max_value=payload.max_value,
        optimal_min_value=payload.optimal_min_value,
        optimal_max_value=payload.optimal_max_value,
        unit=payload.unit,
        severity_below=payload.severity_below,
        severity_above=payload.severity_above,
        notes=payload.notes,
        source=payload.source,
        is_active=payload.is_active,
        created_by=payload.created_by,
    )
    return create_plant_threshold(db, threshold)


def update_plant_threshold_service(db: Session, threshold_id: UUID, payload: PlantThresholdUpdate):
    threshold = get_plant_threshold_service(db, threshold_id)
    reading_type_id = payload.reading_type_id or threshold.reading_type_id
    _validate_threshold_payload(db, threshold.plant_id, reading_type_id, threshold.id)

    fields_set = payload.model_fields_set
    if "reading_type_id" in fields_set:
        threshold.reading_type_id = payload.reading_type_id
    if "min_value" in fields_set:
        threshold.min_value = payload.min_value
    if "max_value" in fields_set:
        threshold.max_value = payload.max_value
    if "optimal_min_value" in fields_set:
        threshold.optimal_min_value = payload.optimal_min_value
    if "optimal_max_value" in fields_set:
        threshold.optimal_max_value = payload.optimal_max_value
    if "unit" in fields_set:
        threshold.unit = payload.unit
    if "severity_below" in fields_set:
        threshold.severity_below = payload.severity_below
    if "severity_above" in fields_set:
        threshold.severity_above = payload.severity_above
    if "notes" in fields_set:
        threshold.notes = payload.notes
    if "source" in fields_set:
        threshold.source = payload.source
    if "is_active" in fields_set:
        threshold.is_active = payload.is_active
    if payload.modified_by is not None:
        threshold.modified_by = payload.modified_by
    threshold.modified_on = datetime.utcnow()
    return update_plant_threshold(db, threshold)


def delete_plant_threshold_service(db: Session, threshold_id: UUID, modified_by: str | None = None):
    threshold = get_plant_threshold_service(db, threshold_id)
    threshold.is_deleted = True
    threshold.is_active = False
    threshold.deleted_on = datetime.utcnow()
    threshold.modified_on = datetime.utcnow()
    threshold.modified_by = modified_by
    return update_plant_threshold(db, threshold)


def _evaluate_metric_status(value: Decimal | None, threshold) -> tuple[str, str | None]:
    if value is None:
        return "unknown", "No readings available yet"

    if threshold.min_value is not None and value < Decimal(threshold.min_value):
        return threshold.severity_below or "critical", f"Value {value} is below minimum {threshold.min_value}"
    if threshold.max_value is not None and value > Decimal(threshold.max_value):
        return threshold.severity_above or "critical", f"Value {value} is above maximum {threshold.max_value}"

    in_optimal_lower = threshold.optimal_min_value is None or value >= Decimal(threshold.optimal_min_value)
    in_optimal_upper = threshold.optimal_max_value is None or value <= Decimal(threshold.optimal_max_value)
    if in_optimal_lower and in_optimal_upper:
        return "healthy", "Value is within the optimal range"

    return "warning", "Value is acceptable but outside the optimal range"


def get_plant_health_summary_service(db: Session, plant_id: UUID):
    plant = get_plant_by_id(db, plant_id)
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")

    thresholds = list_thresholds_by_plant_id(db, plant_id)
    latest_values = list_latest_values_for_plant(db, plant_id)

    metrics = []
    overall_rank = 0
    ranks = {"unknown": 0, "healthy": 1, "warning": 2, "critical": 3}

    for threshold in thresholds:
        latest_row = latest_values.get(str(threshold.reading_type_id))
        latest_value = coerce_latest_numeric_value(latest_row)
        metric_status, message = _evaluate_metric_status(latest_value, threshold)
        overall_rank = max(overall_rank, ranks.get(metric_status, 0))

        metrics.append(
            PlantHealthMetricResponse(
                reading_type_id=threshold.reading_type_id,
                reading_type_code=(latest_row.reading_type_code if latest_row else "") or "",
                reading_type_name=(latest_row.reading_type_name if latest_row else "") or "",
                unit=threshold.unit or (latest_row.reading_type_unit if latest_row else None),
                threshold_id=threshold.id,
                latest_reading_id=(latest_row.reading_id if latest_row else None),
                latest_reading_at=(latest_row.reading_ts if latest_row else None),
                latest_value=latest_value,
                min_value=threshold.min_value,
                max_value=threshold.max_value,
                optimal_min_value=threshold.optimal_min_value,
                optimal_max_value=threshold.optimal_max_value,
                status=metric_status,
                message=message,
            )
        )

    overall_status = "unknown"
    for status_code, rank in ranks.items():
        if rank == overall_rank:
            overall_status = status_code

    return PlantHealthSummaryResponse(
        plant_id=plant.id,
        plant_name=plant.name,
        overall_status=overall_status,
        metrics=metrics,
    )
