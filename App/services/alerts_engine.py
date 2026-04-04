from __future__ import annotations

from decimal import Decimal
from typing import Any

from sqlalchemy.orm import Session

from App.core.config import settings
from App.repositories.alert_jobs_repository import create_alert_job, exists_recent_alert_job
from database.models.alert import Alert
from database.models.alert_job import AlertJob
from database.models.clients import Client
from database.models.installation import Installation
from database.models.plant import Plant
from database.models.reading import Reading
from database.models.reading_type import ReadingType
from database.models.reading_value import ReadingValue


NUMERIC_VALUE_TYPES = {"decimal", "integer", "number", "numeric"}
TEXT_VALUE_TYPES = {"string", "text"}
BOOLEAN_VALUE_TYPES = {"boolean"}


def enqueue_alert_jobs_for_reading(db: Session, reading: Reading):
    if reading is None or reading.client_id is None or reading.installation_id is None:
        return []

    reading_values = (
        db.query(ReadingValue)
        .filter(ReadingValue.reading_id == reading.id)
        .all()
    )

    if not reading_values:
        return []

    jobs = []
    for reading_value in reading_values:
        alert_candidates = _get_applicable_alerts(db, reading, reading_value.reading_type_id)
        if not alert_candidates:
            continue

        reading_type = db.query(ReadingType).filter(ReadingType.id == reading_value.reading_type_id).first()
        plant = db.query(Plant).filter(Plant.id == reading.plant_id).first() if reading.plant_id else None
        installation = db.query(Installation).filter(Installation.id == reading.installation_id).first() if reading.installation_id else None
        client = db.query(Client).filter(Client.id == reading.client_id).first() if reading.client_id else None

        for alert in alert_candidates:
            if not _is_alert_triggered(alert, reading_type, reading_value):
                continue

            if exists_recent_alert_job(
                db,
                alert_id=alert.id,
                plant_id=reading.plant_id,
                cooldown_minutes=settings.ALERT_JOB_COOLDOWN_MINUTES,
            ):
                continue

            payload = _build_email_payload(
                alert=alert,
                reading=reading,
                reading_value=reading_value,
                reading_type=reading_type,
                client=client,
                installation=installation,
                plant=plant,
            )

            job = AlertJob(
                alert_id=alert.id,
                reading_id=reading.id,
                plant_id=reading.plant_id,
                status="PENDING",
                payload=payload,
            )
            jobs.append(create_alert_job(db, job))

    return jobs


def _get_applicable_alerts(db: Session, reading: Reading, reading_type_id):
    return (
        db.query(Alert)
        .filter(
            Alert.is_deleted == False,  # noqa: E712
            Alert.is_active == True,  # noqa: E712
            Alert.client_id == reading.client_id,
            Alert.reading_type_id == reading_type_id,
            (
                ((Alert.plant_id.is_not(None)) & (Alert.plant_id == reading.plant_id))
                |
                ((Alert.plant_id.is_(None)) & (Alert.installation_id == reading.installation_id))
            ),
        )
        .order_by(Alert.name.asc())
        .all()
    )


def _extract_actual_value(reading_type: ReadingType | None, reading_value: ReadingValue):
    value_type = (reading_type.value_type if reading_type else "").strip().lower()

    if value_type in NUMERIC_VALUE_TYPES:
        if reading_value.value_decimal is not None:
            return Decimal(reading_value.value_decimal)
        if reading_value.value_integer is not None:
            return Decimal(reading_value.value_integer)
        return None

    if value_type in TEXT_VALUE_TYPES:
        return reading_value.value_text

    if value_type in BOOLEAN_VALUE_TYPES:
        return reading_value.value_boolean

    if reading_value.value_decimal is not None:
        return Decimal(reading_value.value_decimal)
    if reading_value.value_integer is not None:
        return Decimal(reading_value.value_integer)
    if reading_value.value_text is not None:
        return reading_value.value_text
    return reading_value.value_boolean


def _is_alert_triggered(alert: Alert, reading_type: ReadingType | None, reading_value: ReadingValue):
    actual_value = _extract_actual_value(reading_type, reading_value)
    if actual_value is None:
        return False

    condition = (alert.condition_type or "").strip().upper()
    value_type = (reading_type.value_type if reading_type else "").strip().lower()

    if value_type in NUMERIC_VALUE_TYPES:
        actual_number = Decimal(actual_value)
        if condition == "MIN":
            return alert.min_value is not None and actual_number < Decimal(alert.min_value)
        if condition == "MAX":
            return alert.max_value is not None and actual_number > Decimal(alert.max_value)
        if condition == "RANGE":
            if alert.min_value is None or alert.max_value is None:
                return False
            return actual_number < Decimal(alert.min_value) or actual_number > Decimal(alert.max_value)
        if condition == "EQUALS":
            return alert.exact_numeric_value is not None and actual_number == Decimal(alert.exact_numeric_value)
        return False

    if value_type in TEXT_VALUE_TYPES:
        return condition == "EQUALS" and alert.exact_text_value is not None and str(actual_value) == str(alert.exact_text_value)

    if value_type in BOOLEAN_VALUE_TYPES:
        return condition == "BOOLEAN_EQUALS" and alert.exact_boolean_value is not None and bool(actual_value) == bool(alert.exact_boolean_value)

    return False


def _format_current_value(reading_type: ReadingType | None, reading_value: ReadingValue):
    value = _extract_actual_value(reading_type, reading_value)
    if value is None:
        return "-"

    if isinstance(value, bool):
        return "true" if value else "false"

    if reading_type and getattr(reading_type, "unit", None):
        return f"{value} {reading_type.unit}"

    return str(value)


def _build_condition_summary(alert: Alert):
    condition = (alert.condition_type or "").strip().upper()
    if condition == "MIN":
        return f"Value below {alert.min_value}"
    if condition == "MAX":
        return f"Value above {alert.max_value}"
    if condition == "RANGE":
        return f"Value outside range {alert.min_value} - {alert.max_value}"
    if condition == "EQUALS":
        if alert.exact_numeric_value is not None:
            return f"Value equals {alert.exact_numeric_value}"
        return f"Value equals '{alert.exact_text_value}'"
    if condition == "BOOLEAN_EQUALS":
        return f"Value equals {'true' if alert.exact_boolean_value else 'false'}"
    return condition


def _build_email_payload(*, alert: Alert, reading: Reading, reading_value: ReadingValue, reading_type: ReadingType | None, client: Client | None, installation: Installation | None, plant: Plant | None):
    current_value = _format_current_value(reading_type, reading_value)
    condition_summary = _build_condition_summary(alert)
    reading_type_name = reading_type.name if reading_type else str(reading_value.reading_type_id)
    plant_name = plant.name if plant else "-"
    installation_name = installation.name if installation else "-"
    client_name = client.name if client else "-"

    subject = f"[Greenlytics] Alert triggered - {plant_name} - {reading_type_name}"
    body = (
        "Hello,

"
        "A Greenlytics alert has been triggered.

"
        f"Alert: {alert.name}
"
        f"Client: {client_name}
"
        f"Installation: {installation_name}
"
        f"Plant: {plant_name}
"
        f"Reading type: {reading_type_name}
"
        f"Current value: {current_value}
"
        f"Condition: {condition_summary}
"
        f"Reading date: {reading.ts}

"
        "Please review the plant status.

"
        "Greenlytics
"
    )

    return {
        "to_email": alert.recipient_email,
        "subject": subject,
        "body": body,
        "alert_id": str(alert.id),
        "alert_name": alert.name,
        "reading_id": str(reading.id),
        "plant_id": str(reading.plant_id) if reading.plant_id else None,
        "client_name": client_name,
        "installation_name": installation_name,
        "plant_name": plant_name,
        "reading_type_name": reading_type_name,
        "current_value": current_value,
        "condition_summary": condition_summary,
    }
