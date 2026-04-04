from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from App.core.config import settings
from App.repositories.alert_jobs_repository import (
    claim_pending_alert_jobs,
    discard_alert_job,
    mark_alert_job_sent,
    reschedule_alert_job,
)
from App.services.email_service import EmailDeliveryError, send_email


RETRY_DELAYS_MINUTES = {
    1: 1,
    2: 5,
    3: 15,
    4: 60,
}


def process_pending_alert_jobs(db: Session, *, limit: int | None = None):
    batch_size = limit or settings.ALERT_JOB_BATCH_SIZE
    jobs = claim_pending_alert_jobs(db, limit=batch_size)

    result = {
        "claimed": len(jobs),
        "sent": 0,
        "rescheduled": 0,
        "discarded": 0,
    }

    for job in jobs:
        payload = job.payload or {}
        to_email = payload.get("to_email")
        subject = payload.get("subject")
        body = payload.get("body")

        try:
            if not to_email:
                raise EmailDeliveryError("Alert job payload does not contain to_email")
            if not subject:
                raise EmailDeliveryError("Alert job payload does not contain subject")
            if not body:
                raise EmailDeliveryError("Alert job payload does not contain body")

            send_email(to_email=to_email, subject=subject, body=body)
            mark_alert_job_sent(db, job)
            result["sent"] += 1
        except Exception as exc:
            if job.attempts >= settings.ALERT_JOB_MAX_ATTEMPTS:
                discard_alert_job(db, job, error_message=str(exc))
                result["discarded"] += 1
            else:
                delay_minutes = RETRY_DELAYS_MINUTES.get(job.attempts, 60)
                reschedule_alert_job(
                    db,
                    job,
                    error_message=str(exc),
                    available_at=datetime.utcnow() + timedelta(minutes=delay_minutes),
                )
                result["rescheduled"] += 1

    return result
