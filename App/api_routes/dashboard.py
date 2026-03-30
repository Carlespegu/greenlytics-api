from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from App.dependencies.auth import get_current_active_user
from App.schemas.dashboard import DashboardSummaryResponse
from App.services.dashboard_service import get_dashboard_summary_service
from database.session import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    return get_dashboard_summary_service(db, current_user)
