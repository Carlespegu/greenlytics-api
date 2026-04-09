from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status


CONCURRENCY_ERROR_DETAIL = "The record has been updated by another user. Refresh and try again."


def _normalize_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None

    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)

    return value


def ensure_record_is_current(
    payload_modified_on: datetime | None,
    current_modified_on: datetime | None,
) -> None:
    if _normalize_datetime(payload_modified_on) == _normalize_datetime(current_modified_on):
        return

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=CONCURRENCY_ERROR_DETAIL,
    )
