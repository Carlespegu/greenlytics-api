from datetime import datetime, timedelta
from typing import Iterable
from uuid import UUID

from sqlalchemy.orm import Session

from database.models.alert_job import AlertJob


PROCESSABLE_STATUSES = ("PENDING",)
ACTIVE_RECENT_STATUSES = ("PENDING", "PROCESSING", "SENT")


def create_alert_job(db: Session, job: AlertJob):
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def exists_recent_alert_job(
    db: Session,
    *,
    alert_id: UUID,
    plant_id: UUID | None,
    cooldown_minutes: int,
):
    cutoff = datetime.utcnow() - timedelta(minutes=cooldown_minutes)

    query = db.query(AlertJob).filter(
        AlertJob.alert_id == alert_id,
        AlertJob.created_at >= cutoff,
        AlertJob.status.in_(ACTIVE_RECENT_STATUSES),
    )

    if plant_id is None:
        query = query.filter(AlertJob.plant_id.is_(None))
    else:
        query = query.filter(AlertJob.plant_id == plant_id)

    return db.query(query.exists()).scalar()


def claim_pending_alert_jobs(db: Session, *, limit: int) -> list[AlertJob]:
    now = datetime.utcnow()

    jobs = (
        db.query(AlertJob)
        .filter(
            AlertJob.status.in_(PROCESSABLE_STATUSES),
            AlertJob.available_at <= now,
        )
        .order_by(AlertJob.available_at.asc(), AlertJob.created_at.asc())
        .with_for_update(skip_locked=True)
        .limit(limit)
        .all()
    )

    for job in jobs:
        job.status = "PROCESSING"
        job.locked_at = now
        job.attempts = (job.attempts or 0) + 1
        job.error_message = None

    if jobs:
        db.commit()
        for job in jobs:
            db.refresh(job)

    return jobs


def mark_alert_job_sent(db: Session, job: AlertJob):
    job.status = "SENT"
    job.processed_at = datetime.utcnow()
    job.locked_at = None
    job.error_message = None
    db.commit()
    db.refresh(job)
    return job


def reschedule_alert_job(db: Session, job: AlertJob, *, error_message: str, available_at: datetime):
    job.status = "PENDING"
    job.available_at = available_at
    job.locked_at = None
    job.error_message = error_message
    db.commit()
    db.refresh(job)
    return job


def discard_alert_job(db: Session, job: AlertJob, *, error_message: str):
    job.status = "DISCARDED"
    job.locked_at = None
    job.processed_at = datetime.utcnow()
    job.error_message = error_message
    db.commit()
    db.refresh(job)
    return job
