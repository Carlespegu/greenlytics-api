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


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    items = list_alerts_service(db)
    if current_user.role_code.upper() == "ADMIN":
        return items
    return [item for item in items if item.client_id == current_user.client_id]


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
    return alert


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles("ADMIN", "MANAGER")),
):
    ensure_client_scope(current_user, payload.client_id)
    return create_alert_service(db, payload)


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

    return update_alert_service(db, alert_id, payload)


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
