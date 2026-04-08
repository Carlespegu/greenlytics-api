from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from App.dependencies.auth import ensure_client_scope, get_current_active_user, require_roles
from App.schemas.alerts import AlertCreate, AlertResponse, AlertUpdate
from App.schemas.alerts_search import AlertSearchRequest, AlertSearchResponse
from App.services.alerts_service import (
    create_alert_service,
    delete_alert_service,
    get_alert_service,
    list_alerts_service,
    search_alerts_service,
    update_alert_service,
)
from database.session import get_db

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _serialize_alert(alert):
    return {
        "id": alert.id,
        "client_id": alert.client_id,
        "installation_id": alert.installation_id,
        "plant_id": alert.plant_id,
        "reading_type_id": alert.reading_type_id,
        "name": alert.name,
        "description": alert.description,
        "channel": alert.channel,
        "recipient_email": alert.recipient_email,
        "condition_type": alert.condition_type,
        "min_value": alert.min_value,
        "max_value": alert.max_value,
        "exact_numeric_value": alert.exact_numeric_value,
        "exact_text_value": alert.exact_text_value,
        "exact_boolean_value": alert.exact_boolean_value,
        "is_active": alert.is_active,
        "created_on": getattr(alert, "created_at", None),
        "created_by": str(alert.created_by) if getattr(alert, "created_by", None) else None,
        "modified_on": getattr(alert, "modified_at", None),
        "modified_by": str(alert.modified_by) if getattr(alert, "modified_by", None) else None,
        "deleted_on": getattr(alert, "deleted_on", None),
        "is_deleted": alert.is_deleted,
    }


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    items = list_alerts_service(db)
    if current_user.role_code.upper() == "ADMIN":
        return [_serialize_alert(item) for item in items]
    return [_serialize_alert(item) for item in items if item.client_id == current_user.client_id]


@router.post("/search", response_model=AlertSearchResponse)
def search_alerts(
    payload: AlertSearchRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role_code.upper() != "ADMIN":
        payload.client_id = {"filter_value": current_user.client_id, "comparator": "equals"}  # type: ignore
    return search_alerts_service(db, payload)


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    alert = get_alert_service(db, alert_id)
    ensure_client_scope(current_user, alert.client_id)
    return _serialize_alert(alert)


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, payload.client_id)
    payload.created_by = current_user.id
    return _serialize_alert(create_alert_service(db, payload))


@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert(
    alert_id: UUID,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    alert = get_alert_service(db, alert_id)
    ensure_client_scope(current_user, alert.client_id)

    if payload.client_id is not None:
        ensure_client_scope(current_user, payload.client_id)

    payload.modified_by = current_user.id
    return _serialize_alert(update_alert_service(db, alert_id, payload))


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    alert = get_alert_service(db, alert_id)
    ensure_client_scope(current_user, alert.client_id)
    delete_alert_service(db, alert_id)
    return None
