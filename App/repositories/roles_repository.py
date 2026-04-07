from uuid import UUID
from sqlalchemy.orm import Session

from database.models.roles import Role


def get_all_roles(db: Session):
    return (
        db.query(Role)
        .filter(Role.is_deleted == False)  # noqa: E712
        .order_by(Role.name.asc())
        .all()
    )


def get_roles_by_codes(db: Session, codes: list[str]):
    normalized_codes = [code.strip().upper() for code in codes if str(code).strip()]

    return (
        db.query(Role)
        .filter(
            Role.is_deleted == False,  # noqa: E712
            Role.code.in_(normalized_codes),
        )
        .order_by(Role.name.asc())
        .all()
    )


def get_role_by_id(db: Session, role_id: UUID):
    return (
        db.query(Role)
        .filter(Role.id == role_id, Role.is_deleted == False)  # noqa: E712
        .first()
    )


def get_role_by_code(db: Session, code: str):
    return (
        db.query(Role)
        .filter(Role.code == code, Role.is_deleted == False)  # noqa: E712
        .first()
    )


def create_role(db: Session, role: Role):
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


def update_role(db: Session, role: Role):
    db.commit()
    db.refresh(role)
    return role
