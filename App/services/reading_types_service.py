from sqlalchemy.orm import Session

from App.repositories.reading_types_repository import get_all_reading_types


def list_reading_types_service(db: Session):
    return get_all_reading_types(db)
