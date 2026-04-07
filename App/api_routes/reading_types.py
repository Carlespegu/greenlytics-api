from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from App.dependencies.auth import get_current_active_user
from App.schemas.reading_types import ReadingTypeResponse
from App.services.reading_types_service import list_reading_types_service
from database.session import get_db

router = APIRouter(prefix="/reading-types", tags=["Reading Types"])


@router.get("", response_model=List[ReadingTypeResponse])
def list_reading_types(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    return list_reading_types_service(db)
