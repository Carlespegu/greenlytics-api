from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from App.dependencies.auth import get_current_active_user
from App.schemas.readings import ReadingListItem
from App.services.readings_service import list_readings_service
from database.session import get_db

router = APIRouter(prefix='/readings', tags=['Readings'])


@router.get('', response_model=List[ReadingListItem])
def list_readings(
    limit: int = Query(default=300, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    return list_readings_service(db, current_user, limit)
