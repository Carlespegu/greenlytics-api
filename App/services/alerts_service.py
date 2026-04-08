from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from App.repositories.alerts_repository import (
    create_alert,
    get_alert_by_id,
    get_all_alerts,
    search_alerts,
    update_alert,
)
from App.repositories.clients_repository import get_client_by_id
from App.repositories.installations_repository import get_installation_by_id
from App.repositories.plants_repository import get_plant_by_id
from App.repositories.reading_types_repository import get_reading_type_by_id
from App.schemas.alerts import AlertCreate, AlertUpdate
from database.models.alert import Alert

_ALLOWED_CHANNELS = {"EMAIL"}
_ALLOWED_CONDITION_TYPES = {"MIN", "MAX", "RANGE", "EQUALS", "BOOLEAN_EQUALS"}


def list_alerts_service(db: Session):
    return get_all_alerts(db)



def search_alerts_service(db: Session, payload):
    try:
        return search_alerts(db, payload)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc



def get_alert_service(db: Session, alert_id: UUID):
    alert = get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    return alert



def _normalize_empty_string(value):
    if value is None:
        return None
    text = str(value).strip()
    return text or None



def _validate_scope(db: Session, client_id: UUID, installation_id, plant_id):
    client = get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )

    if installation_id is None and plant_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one of installation_id or plant_id must be informed",
        )

    installation = None
    if installation_id is not None:
        installation = get_installation_by_id(db, installation_id)
        if not installation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Installation not found",
            )
        if installation.client_id != client_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Installation does not belong to the provided client",
            )

    if plant_id is not None:
        plant = get_plant_by_id(db, plant_id)
        if not plant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Plant not found",
            )
        if plant.client_id != client_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Plant does not belong to the provided client",
            )
        if installation_id is not None and plant.installation_id != installation_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Plant does not belong to the provided installation",
            )



def _validate_rule_for_reading_type(reading_type, condition_type, min_value, max_value, exact_numeric_value, exact_text_value, exact_boolean_value):
    if not reading_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reading type not found",
        )

    normalized_condition = (condition_type or "").strip().upper()
    if normalized_condition not in _ALLOWED_CONDITION_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported condition_type '{condition_type}'",
        )

    reading_value_type = (reading_type.value_type or "").strip().lower()
    numeric_types = {"decimal", "integer", "number", "numeric"}

    if reading_value_type in numeric_types:
        if normalized_condition == "MIN":
            if min_value is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_value is required for MIN condition")
        elif normalized_condition == "MAX":
            if max_value is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="max_value is required for MAX condition")
        elif normalized_condition == "RANGE":
            if min_value is None or max_value is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_value and max_value are required for RANGE condition")
            if min_value > max_value:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="min_value cannot be greater than max_value")
        elif normalized_condition == "EQUALS":
            if exact_numeric_value is None:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="exact_numeric_value is required for EQUALS condition with numeric reading type")
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="BOOLEAN_EQUALS is not valid for numeric reading type")

        if exact_text_value is not None or exact_boolean_value is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text or boolean exact values are not valid for numeric reading type")
        return

    if reading_value_type in {"string", "text"}:
        if normalized_condition != "EQUALS":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text reading type only supports EQUALS condition")
        if exact_text_value is None or not str(exact_text_value).strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="exact_text_value is required for text reading type")
        if any(value is not None for value in [min_value, max_value, exact_numeric_value, exact_boolean_value]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Numeric or boolean values are not valid for text reading type")
        return

    if reading_value_type == "boolean":
        if normalized_condition != "BOOLEAN_EQUALS":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Boolean reading type only supports BOOLEAN_EQUALS condition")
        if exact_boolean_value is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="exact_boolean_value is required for boolean reading type")
        if any(value is not None for value in [min_value, max_value, exact_numeric_value, exact_text_value]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Numeric or text values are not valid for boolean reading type")
        return

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"Unsupported reading type value_type '{reading_type.value_type}'",
    )



def create_alert_service(db: Session, payload: AlertCreate):
    normalized_channel = (payload.channel or "EMAIL").strip().upper()
    if normalized_channel not in _ALLOWED_CHANNELS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported channel '{payload.channel}'")

    _validate_scope(db, payload.client_id, payload.installation_id, payload.plant_id)

    reading_type = get_reading_type_by_id(db, payload.reading_type_id)
    _validate_rule_for_reading_type(
        reading_type,
        payload.condition_type,
        payload.min_value,
        payload.max_value,
        payload.exact_numeric_value,
        _normalize_empty_string(payload.exact_text_value),
        payload.exact_boolean_value,
    )

    alert = Alert(
        client_id=payload.client_id,
        installation_id=payload.installation_id,
        plant_id=payload.plant_id,
        reading_type_id=payload.reading_type_id,
        name=payload.name.strip(),
        description=_normalize_empty_string(payload.description),
        channel=normalized_channel,
        recipient_email=str(payload.recipient_email).strip().lower() if payload.recipient_email is not None else None,
        condition_type=payload.condition_type.strip().upper(),
        value_type=(reading_type.value_type or "").strip().upper(),
        min_value=payload.min_value,
        max_value=payload.max_value,
        exact_numeric_value=payload.exact_numeric_value,
        exact_text_value=_normalize_empty_string(payload.exact_text_value),
        exact_boolean_value=payload.exact_boolean_value,
        is_active=payload.is_active,
        created_by=payload.created_by,
    )

    return create_alert(db, alert)



def update_alert_service(db: Session, alert_id: UUID, payload: AlertUpdate):
    alert = get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    new_client_id = alert.client_id if payload.client_id is None else payload.client_id
    new_installation_id = alert.installation_id if payload.installation_id is None else payload.installation_id
    new_plant_id = alert.plant_id if payload.plant_id is None else payload.plant_id
    new_reading_type_id = alert.reading_type_id if payload.reading_type_id is None else payload.reading_type_id
    new_condition_type = alert.condition_type if payload.condition_type is None else payload.condition_type
    new_channel = alert.channel if payload.channel is None else payload.channel

    new_min_value = alert.min_value if payload.min_value is None else payload.min_value
    new_max_value = alert.max_value if payload.max_value is None else payload.max_value
    new_exact_numeric_value = alert.exact_numeric_value if payload.exact_numeric_value is None else payload.exact_numeric_value
    new_exact_text_value = alert.exact_text_value if payload.exact_text_value is None else _normalize_empty_string(payload.exact_text_value)
    new_exact_boolean_value = alert.exact_boolean_value if payload.exact_boolean_value is None else payload.exact_boolean_value

    normalized_channel = (new_channel or "EMAIL").strip().upper()
    if normalized_channel not in _ALLOWED_CHANNELS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported channel '{new_channel}'")

    _validate_scope(db, new_client_id, new_installation_id, new_plant_id)

    reading_type = get_reading_type_by_id(db, new_reading_type_id)
    _validate_rule_for_reading_type(
        reading_type,
        new_condition_type,
        new_min_value,
        new_max_value,
        new_exact_numeric_value,
        new_exact_text_value,
        new_exact_boolean_value,
    )

    alert.client_id = new_client_id
    alert.installation_id = new_installation_id
    alert.plant_id = new_plant_id
    alert.reading_type_id = new_reading_type_id
    alert.value_type = (reading_type.value_type or "").strip().upper()

    if payload.name is not None:
        alert.name = payload.name.strip()
    if payload.description is not None:
        alert.description = _normalize_empty_string(payload.description)
    alert.channel = normalized_channel
    if payload.recipient_email is not None:
        alert.recipient_email = str(payload.recipient_email).strip().lower()
    if payload.condition_type is not None:
        alert.condition_type = payload.condition_type.strip().upper()

    alert.min_value = new_min_value
    alert.max_value = new_max_value
    alert.exact_numeric_value = new_exact_numeric_value
    alert.exact_text_value = new_exact_text_value
    alert.exact_boolean_value = new_exact_boolean_value

    if payload.is_active is not None:
        alert.is_active = payload.is_active
    if payload.modified_by is not None:
        alert.modified_by = payload.modified_by

    alert.modified_at = datetime.utcnow()
    return update_alert(db, alert)



def delete_alert_service(db: Session, alert_id: UUID):
    alert = get_alert_by_id(db, alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    alert.is_deleted = True
    alert.modified_at = datetime.utcnow()
    alert.is_active = False

    return update_alert(db, alert)
