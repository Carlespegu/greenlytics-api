from typing import Iterable


SUPPORTED_LANGUAGES = {"ca", "es", "en"}


DEVICE_TYPE_TRANSLATIONS = {
    "SOIL_SENSOR": {
        "ca": {"name": "Sensor de sol", "description": "Dispositiu per mesurar humitat o condicions del sol."},
        "es": {"name": "Sensor de suelo", "description": "Dispositivo para medir humedad o condiciones del suelo."},
        "en": {"name": "Soil sensor", "description": "Device used to measure soil moisture or soil conditions."},
    },
    "TEMPERATURE_SENSOR": {
        "ca": {"name": "Sensor de temperatura", "description": "Dispositiu per mesurar la temperatura."},
        "es": {"name": "Sensor de temperatura", "description": "Dispositivo para medir la temperatura."},
        "en": {"name": "Temperature sensor", "description": "Device used to measure temperature."},
    },
    "HUMIDITY_SENSOR": {
        "ca": {"name": "Sensor d'humitat", "description": "Dispositiu per mesurar la humitat."},
        "es": {"name": "Sensor de humedad", "description": "Dispositivo para medir la humedad."},
        "en": {"name": "Humidity sensor", "description": "Device used to measure humidity."},
    },
    "LIGHT_SENSOR": {
        "ca": {"name": "Sensor de llum", "description": "Dispositiu per mesurar la llum ambiental."},
        "es": {"name": "Sensor de luz", "description": "Dispositivo para medir la luz ambiental."},
        "en": {"name": "Light sensor", "description": "Device used to measure ambient light."},
    },
    "RAIN_SENSOR": {
        "ca": {"name": "Sensor de pluja", "description": "Dispositiu per detectar pluja o humitat exterior."},
        "es": {"name": "Sensor de lluvia", "description": "Dispositivo para detectar lluvia o humedad exterior."},
        "en": {"name": "Rain sensor", "description": "Device used to detect rain or exterior moisture."},
    },
    "WEATHER_STATION": {
        "ca": {"name": "Estacio meteorologica", "description": "Dispositiu amb multiples mesures ambientals."},
        "es": {"name": "Estacion meteorologica", "description": "Dispositivo con multiples mediciones ambientales."},
        "en": {"name": "Weather station", "description": "Device with multiple environmental measurements."},
    },
    "GATEWAY": {
        "ca": {"name": "Gateway", "description": "Dispositiu passarela de comunicacions."},
        "es": {"name": "Gateway", "description": "Dispositivo pasarela de comunicaciones."},
        "en": {"name": "Gateway", "description": "Communications gateway device."},
    },
    "CONTROLLER": {
        "ca": {"name": "Controlador", "description": "Dispositiu de control i automatitzacio."},
        "es": {"name": "Controlador", "description": "Dispositivo de control y automatizacion."},
        "en": {"name": "Controller", "description": "Control and automation device."},
    },
}


NAME_ALIASES = {
    "sensor de sol": "SOIL_SENSOR",
    "sensor de suelo": "SOIL_SENSOR",
    "soil sensor": "SOIL_SENSOR",
    "sensor de temperatura": "TEMPERATURE_SENSOR",
    "temperature sensor": "TEMPERATURE_SENSOR",
    "sensor d'humitat": "HUMIDITY_SENSOR",
    "sensor de humedad": "HUMIDITY_SENSOR",
    "humidity sensor": "HUMIDITY_SENSOR",
    "sensor de llum": "LIGHT_SENSOR",
    "sensor de luz": "LIGHT_SENSOR",
    "light sensor": "LIGHT_SENSOR",
    "sensor de pluja": "RAIN_SENSOR",
    "sensor de lluvia": "RAIN_SENSOR",
    "rain sensor": "RAIN_SENSOR",
    "estacio meteorologica": "WEATHER_STATION",
    "estacion meteorologica": "WEATHER_STATION",
    "weather station": "WEATHER_STATION",
    "gateway": "GATEWAY",
    "controlador": "CONTROLLER",
    "controller": "CONTROLLER",
}


def normalize_language(value: str | None) -> str:
    if not value:
        return "ca"

    candidate = value.split(",")[0].split("-")[0].strip().lower()
    if candidate in SUPPORTED_LANGUAGES:
        return candidate
    return "ca"


def _canonical_key(code: str | None, name: str | None) -> str | None:
    safe_code = (code or "").strip().upper()
    if safe_code in DEVICE_TYPE_TRANSLATIONS:
        return safe_code

    normalized_name = (name or "").strip().lower()
    if normalized_name in NAME_ALIASES:
        return NAME_ALIASES[normalized_name]

    return None


def localize_device_type_fields(code: str | None, name: str | None, description: str | None, language: str) -> tuple[str | None, str | None]:
    canonical_key = _canonical_key(code, name)
    translation = DEVICE_TYPE_TRANSLATIONS.get(canonical_key or "", {}).get(language, {})

    localized_name = translation.get("name", name)
    localized_description = translation.get("description", description)
    return localized_name, localized_description


def localize_device_type_item(item, language: str):
    localized_name, localized_description = localize_device_type_fields(
        getattr(item, "code", None),
        getattr(item, "name", None),
        getattr(item, "description", None),
        language,
    )

    if isinstance(item, dict):
        localized = dict(item)
        localized["name"] = localized_name
        if "description" in localized:
            localized["description"] = localized_description
        return localized

    localized = {
        "id": getattr(item, "id", None),
        "code": getattr(item, "code", None),
        "name": localized_name,
    }

    if hasattr(item, "description"):
        localized["description"] = localized_description
    if hasattr(item, "is_active"):
        localized["is_active"] = getattr(item, "is_active", None)
    if hasattr(item, "created_on"):
        localized["created_on"] = getattr(item, "created_on", None)
    if hasattr(item, "modified_on"):
        localized["modified_on"] = getattr(item, "modified_on", None)
    if hasattr(item, "deleted_on"):
        localized["deleted_on"] = getattr(item, "deleted_on", None)
    if hasattr(item, "is_deleted"):
        localized["is_deleted"] = getattr(item, "is_deleted", None)

    return localized


def localize_device_type_items(items: Iterable, language: str):
    return [localize_device_type_item(item, language) for item in items]
