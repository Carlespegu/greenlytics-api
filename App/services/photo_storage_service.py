import json
from urllib import error, parse, request

from fastapi import HTTPException, status

from App.core.config import settings


def _require_storage_config():
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase Storage is not configured",
        )


def upload_file_to_storage(*, storage_path: str, content: bytes, content_type: str):
    _require_storage_config()
    normalized_path = storage_path.lstrip("/")
    encoded_segments = "/".join(parse.quote(segment, safe="") for segment in normalized_path.split("/"))
    upload_url = (
        f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/"
        f"{settings.SUPABASE_STORAGE_BUCKET}/{encoded_segments}"
    )
    storage_request = request.Request(
        upload_url,
        data=content,
        headers={
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": content_type,
            "x-upsert": "false",
        },
        method="POST",
    )
    try:
        with request.urlopen(storage_request, timeout=60):
            return normalized_path
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not upload photo to storage: {detail}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not upload photo to storage: {exc}",
        ) from exc


def delete_file_from_storage(storage_path: str):
    _require_storage_config()
    normalized_path = storage_path.lstrip("/")
    encoded_segments = "/".join(parse.quote(segment, safe="") for segment in normalized_path.split("/"))
    delete_url = (
        f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/"
        f"{settings.SUPABASE_STORAGE_BUCKET}/{encoded_segments}"
    )
    delete_request = request.Request(
        delete_url,
        headers={
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        },
        method="DELETE",
    )
    try:
        with request.urlopen(delete_request, timeout=30):
            return True
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not delete photo from storage: {detail}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not delete photo from storage: {exc}",
        ) from exc


def create_signed_url(storage_path: str) -> str | None:
    _require_storage_config()
    normalized_path = storage_path.lstrip("/")
    encoded_segments = "/".join(parse.quote(segment, safe="") for segment in normalized_path.split("/"))
    sign_url = (
        f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/sign/"
        f"{settings.SUPABASE_STORAGE_BUCKET}/{encoded_segments}"
    )
    sign_request = request.Request(
        sign_url,
        data=json.dumps({"expiresIn": settings.SUPABASE_SIGNED_URL_EXPIRES_IN}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with request.urlopen(sign_request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    signed_path = payload.get("signedURL")
    if not signed_path:
        return None
    if signed_path.startswith("http"):
        return signed_path
    return f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1{signed_path}"


def download_file_from_storage(storage_path: str) -> bytes:
    _require_storage_config()
    normalized_path = storage_path.lstrip("/")
    encoded_segments = "/".join(parse.quote(segment, safe="") for segment in normalized_path.split("/"))
    download_url = (
        f"{settings.SUPABASE_URL.rstrip('/')}/storage/v1/object/"
        f"{settings.SUPABASE_STORAGE_BUCKET}/{encoded_segments}"
    )
    download_request = request.Request(
        download_url,
        headers={
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
            "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        },
        method="GET",
    )
    try:
        with request.urlopen(download_request, timeout=60) as response:
            return response.read()
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not download photo from storage: {detail}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not download photo from storage: {exc}",
        ) from exc
