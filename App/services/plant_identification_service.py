import base64
import json
import mimetypes
import re
from typing import Any
from urllib import error, request
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from App.core.config import settings
from App.schemas.plants_identification import PlantIdentificationResponse


MAX_IMAGE_BYTES = 8 * 1024 * 1024


def _language_name(language_code: str) -> str:
    normalized = (language_code or "ca").lower()
    mapping = {
        "ca": "Catalan",
        "es": "Spanish",
        "en": "English",
    }
    return mapping.get(normalized, "Catalan")


def _read_image_as_data_url(filename: str | None, content_type: str | None, data: bytes) -> str:
    mime_type = content_type or mimetypes.guess_type(filename or "")[0] or "image/jpeg"
    encoded = base64.b64encode(data).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def _extract_output_text(payload: dict[str, Any]) -> str:
    output_text = payload.get("output_text")
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and isinstance(content.get("text"), str):
                return content["text"]

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail="OpenAI response did not contain structured text output",
    )


def _extract_json_object(text: str) -> dict[str, Any]:
    cleaned = (text or "").strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise
        return json.loads(cleaned[start : end + 1])


def _normalize_enum(value: Any, allowed: set[str]) -> str | None:
    if not value:
        return None
    normalized = str(value).strip().lower().replace("-", "_").replace(" ", "_")
    return normalized if normalized in allowed else None


def _normalize_confidence(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(1.0, numeric))


def _build_suggested_code(
    client_id: UUID | None,
    installation_id: UUID | None,
    scientific_name: str | None,
    common_name: str | None,
    name: str,
) -> str:
    base_name = scientific_name or common_name or name or "plant"
    cleaned = re.sub(r"[^A-Z0-9]+", "-", base_name.upper()).strip("-")
    cleaned = cleaned[:18] or "PLANT"
    client_part = str(client_id)[:4] if client_id else "CLNT"
    installation_part = str(installation_id)[:4] if installation_id else "INST"
    return f"{cleaned}-{client_part}{installation_part}-{str(uuid4())[:4]}".upper()


def identify_plant_from_image(
    *,
    client_id: UUID | None,
    installation_id: UUID | None,
    filename: str | None,
    content_type: str | None,
    image_bytes: bytes,
    language_code: str = "ca",
) -> PlantIdentificationResponse:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured",
        )

    if not image_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file is required",
        )

    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large. Max size is 8 MB",
        )

    data_url = _read_image_as_data_url(filename, content_type, image_bytes)
    response_language = _language_name(language_code)

    prompt = (
        "You are a plant identification assistant for GreenLytics. "
        "Analyze the photo and identify the plant as accurately as possible. "
        "Return only valid JSON with these keys: "
        "name, common_name, scientific_name, plant_type, location_type, sun_exposure, status, "
        "care_summary, current_state, confidence. "
        "Rules: "
        "1) name must be a concise display name in the requested language. "
        "2) common_name and scientific_name should be strings or null. "
        "3) plant_type must be one of: plant, crop, tree, shrub. "
        "4) location_type must be one of: indoor, outdoor, greenhouse. "
        "5) sun_exposure must be one of: full_sun, partial_shade, shade. "
        "6) status must be one of: healthy, warning, critical, inactive. "
        "7) care_summary must explain briefly how to care for this plant in the requested language. "
        "8) current_state must summarize the apparent current condition in the requested language. "
        "9) confidence must be a number from 0 to 1. "
        "10) If uncertain, make the best estimate and lower confidence. "
        "11) Do not wrap the JSON in markdown fences or extra commentary. "
        f"Requested response language: {response_language}."
    )

    payload = {
        "model": settings.OPENAI_MODEL,
        "text": {"format": {"type": "json_object"}},
        "input": [
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": prompt},
                    {"type": "input_image", "image_url": data_url},
                ],
            }
        ],
    }

    api_request = request.Request(
        settings.OPENAI_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(api_request, timeout=60) as response:
            raw_payload = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed with status {exc.code}: {details}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {exc}",
        ) from exc

    output_text = _extract_output_text(raw_payload)

    try:
        identified = _extract_json_object(output_text)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="OpenAI returned invalid JSON for plant identification",
        ) from exc

    name = (identified.get("name") or identified.get("common_name") or identified.get("scientific_name") or "Plant").strip()
    common_name = (identified.get("common_name") or None)
    scientific_name = (identified.get("scientific_name") or None)
    care_summary = (identified.get("care_summary") or None)
    current_state = (identified.get("current_state") or None)

    notes_parts = [part.strip() for part in [current_state, care_summary] if isinstance(part, str) and part.strip()]
    notes = "\n\n".join(notes_parts) or None

    return PlantIdentificationResponse(
        suggested_code=_build_suggested_code(client_id, installation_id, scientific_name, common_name, name),
        name=name,
        common_name=common_name,
        scientific_name=scientific_name,
        plant_type=_normalize_enum(identified.get("plant_type"), {"plant", "crop", "tree", "shrub"}),
        location_type=_normalize_enum(identified.get("location_type"), {"indoor", "outdoor", "greenhouse"}),
        sun_exposure=_normalize_enum(identified.get("sun_exposure"), {"full_sun", "partial_shade", "shade"}),
        status=_normalize_enum(identified.get("status"), {"healthy", "warning", "critical", "inactive"}),
        notes=notes,
        care_summary=care_summary,
        current_state=current_state,
        confidence=_normalize_confidence(identified.get("confidence")),
    )
