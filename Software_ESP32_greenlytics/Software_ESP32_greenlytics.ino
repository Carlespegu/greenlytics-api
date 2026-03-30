#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <esp_sleep.h>
#include <time.h>

// =========================================================
// GREENLYTICS ESP32 FIRMWARE
// Sends readings to POST /device-readings using x-api-key
// Compatible with backend schema: { ts?, plant_id?, values[] }
// =========================================================

// -------------------------
// WIFI
// -------------------------
const char* WIFI_SSID = "MiFibra-9687";
const char* WIFI_PASSWORD = "h447xhrL";

// -------------------------
// API
// -------------------------
const char* API_URL = "https://api.greenlytics.app/device-readings";
const char* API_KEY = "7I128ji0yiT-0CROHYefMuhAjoe-XiPT8vKxDEDJVqw";

// Optional: assign the reading to a plant in the platform.
// Leave empty if the device is not linked to a specific plant.
const char* PLANT_ID = "";

// -------------------------
// TIMING
// -------------------------
const unsigned long WIFI_TIMEOUT_MS = 20000;
const unsigned long HTTP_TIMEOUT_MS = 15000;
const uint64_t SLEEP_MINUTES = 30;
const bool USE_DEEP_SLEEP = false;
const bool ENABLE_NTP_TIME = true;

// -------------------------
// PINS
// -------------------------
const int DHT_PIN = 4;
const int SOIL_PIN = 34;
const int RAIN_PIN = 27;
const int LDR_PIN = 32;

// -------------------------
// SENSOR TYPES
// -------------------------
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// -------------------------
// SOIL CALIBRATION
// -------------------------
const int SOIL_RAW_WET = 1400;
const int SOIL_RAW_DRY = 3200;

struct SensorReading {
  float tempC;
  float humAir;
  int soilRaw;
  int soilPercent;
  int ldrRaw;
  String rain;
  int rssi;
  bool validDht;
};

void logLine(const String& message) {
  Serial.println(message);
}

int clampInt(int value, int minValue, int maxValue) {
  if (value < minValue) return minValue;
  if (value > maxValue) return maxValue;
  return value;
}

int mapSoilRawToPercent(int rawValue) {
  if (SOIL_RAW_DRY == SOIL_RAW_WET) return 0;
  long mapped = map(rawValue, SOIL_RAW_DRY, SOIL_RAW_WET, 0, 100);
  return clampInt((int)mapped, 0, 100);
}

String getRainStatus() {
  int rainDigital = digitalRead(RAIN_PIN);
  return rainDigital == HIGH ? "dry" : "rain";
}

void connectWiFi() {
  logLine("[WiFi] Connecting...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_TIMEOUT_MS) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    logLine("[WiFi] Connected");
    Serial.print("[WiFi] IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] RSSI: ");
    Serial.println(WiFi.RSSI());
  } else {
    logLine("[WiFi] Connection failed");
  }
}

void disconnectWiFi() {
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  logLine("[WiFi] Disconnected");
}

bool syncTimeWithNtp() {
  if (!ENABLE_NTP_TIME || WiFi.status() != WL_CONNECTED) return false;

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  struct tm timeinfo;
  for (int i = 0; i < 15; i++) {
    if (getLocalTime(&timeinfo, 1000)) {
      logLine("[NTP] Time synchronized");
      return true;
    }
  }

  logLine("[NTP] Time synchronization failed");
  return false;
}

String getIsoTimestampUtc() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 1000)) {
    return "";
  }

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

SensorReading readSensors() {
  SensorReading reading;

  reading.tempC = dht.readTemperature();
  reading.humAir = dht.readHumidity();
  reading.validDht = !(isnan(reading.tempC) || isnan(reading.humAir));

  reading.soilRaw = analogRead(SOIL_PIN);
  reading.soilPercent = mapSoilRawToPercent(reading.soilRaw);
  reading.ldrRaw = analogRead(LDR_PIN);
  reading.rain = getRainStatus();
  reading.rssi = WiFi.status() == WL_CONNECTED ? WiFi.RSSI() : -999;

  return reading;
}

void addDecimalValue(JsonArray values, const char* code, float value) {
  JsonObject item = values.createNestedObject();
  item["reading_type_code"] = code;
  item["value_decimal"] = value;
}

void addIntegerValue(JsonArray values, const char* code, int value) {
  JsonObject item = values.createNestedObject();
  item["reading_type_code"] = code;
  item["value_integer"] = value;
}

void addTextValue(JsonArray values, const char* code, const String& value) {
  JsonObject item = values.createNestedObject();
  item["reading_type_code"] = code;
  item["value_text"] = value;
}

String buildJsonPayload(const SensorReading& reading) {
  StaticJsonDocument<768> doc;

  String isoTs = getIsoTimestampUtc();
  if (isoTs.length() > 0) {
    doc["ts"] = isoTs;
  }

  if (strlen(PLANT_ID) > 0) {
    doc["plant_id"] = PLANT_ID;
  }

  JsonArray values = doc.createNestedArray("values");

  if (reading.validDht) {
    addDecimalValue(values, "temp_c", reading.tempC);
    addDecimalValue(values, "hum_air", reading.humAir);
  }

  addIntegerValue(values, "soil_percent", reading.soilPercent);
  addIntegerValue(values, "ldr_raw", reading.ldrRaw);
  addTextValue(values, "rain", reading.rain);
  addIntegerValue(values, "rssi", reading.rssi);

  String payload;
  serializeJson(doc, payload);
  return payload;
}

bool sendReadingToApi(const String& payload) {
  if (WiFi.status() != WL_CONNECTED) {
    logLine("[HTTP] WiFi not connected");
    return false;
  }

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);

  logLine("[HTTP] POST /device-readings");
  Serial.print("[HTTP] Payload: ");
  Serial.println(payload);

  int httpCode = http.POST(payload);
  String responseBody = http.getString();

  Serial.print("[HTTP] Code: ");
  Serial.println(httpCode);
  Serial.print("[HTTP] Response: ");
  Serial.println(responseBody);

  http.end();
  return httpCode >= 200 && httpCode < 300;
}

void printReading(const SensorReading& reading) {
  logLine("[SENSORS] Reading captured");

  if (reading.validDht) {
    Serial.print("  temp_c: ");
    Serial.println(reading.tempC);
    Serial.print("  hum_air: ");
    Serial.println(reading.humAir);
  } else {
    logLine("  DHT read failed");
  }

  Serial.print("  soil_raw: ");
  Serial.println(reading.soilRaw);
  Serial.print("  soil_percent: ");
  Serial.println(reading.soilPercent);
  Serial.print("  ldr_raw: ");
  Serial.println(reading.ldrRaw);
  Serial.print("  rain: ");
  Serial.println(reading.rain);
  Serial.print("  rssi: ");
  Serial.println(reading.rssi);
}

void enterDeepSleepMinutes(uint64_t minutes) {
  uint64_t sleepUs = minutes * 60ULL * 1000000ULL;
  Serial.printf("[SLEEP] Entering deep sleep for %llu minute(s)\n", minutes);
  Serial.flush();
  esp_sleep_enable_timer_wakeup(sleepUs);
  esp_deep_sleep_start();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  logLine("========================================");
  logLine("ESP32 Greenlytics Firmware");
  logLine("========================================");

  pinMode(RAIN_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
  analogSetPinAttenuation(LDR_PIN, ADC_11db);

  dht.begin();
  connectWiFi();
  syncTimeWithNtp();

  SensorReading reading = readSensors();
  printReading(reading);

  String payload = buildJsonPayload(reading);
  bool ok = sendReadingToApi(payload);

  if (ok) {
    logLine("[RESULT] Reading sent successfully");
  } else {
    logLine("[RESULT] Failed to send reading");
  }

  disconnectWiFi();

  if (USE_DEEP_SLEEP) {
    enterDeepSleepMinutes(SLEEP_MINUTES);
  }
}

void loop() {
  delay(1000);
}
