#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <esp_sleep.h>
#include <time.h>
#include <LittleFS.h>
#include <Wire.h>
#include <BH1750.h>

// =========================================================
// GREENLYTICS ESP32-C3 FIRMWARE
// - Read sensors every 1 hour
// - Store every reading locally in LittleFS
// - Upload queued readings every 6 hours
// - JSON format adapted to backend contract
// =========================================================

// -------------------------
// WIFI
// -------------------------
const char* WIFI_SSID = "MiFibra-9687";
const char* WIFI_PASSWORD = "h447xhrL";

// -------------------------
// API
// -------------------------
const char* API_URL = "https://api.greenlytics.app/api/device-readings";
const char* DEVICE_CODE = "SEN-001";
const char* DEVICE_SECRET = "448649EBEF3945D4E5B507C2A4302D8A68D0FCC36C305955F1424016E3BD59A5";
const char* SOURCE = "esp32";

// -------------------------
// TIMING / POWER
// -------------------------
const unsigned long WIFI_TIMEOUT_MS = 10000;
const unsigned long HTTP_TIMEOUT_MS = 10000;
const uint64_t SLEEP_MINUTES = 60;
const uint64_t INITIAL_TIME_RETRY_MINUTES = 10;
const bool ENABLE_NTP_TIME = true;
const uint32_t NTP_SYNC_EVERY_N_CYCLES = 24;   // every 24 hours

// //Real//
// const bool USE_DEEP_SLEEP = false;
// const uint32_t UPLOAD_EVERY_N_CYCLES = 6;      // 6 x 1h = every 6 hours
// //

// Test//
const bool USE_DEEP_SLEEP = true;
const uint32_t UPLOAD_EVERY_N_CYCLES = 1;      // 6 x 1h = every 6 hours
//

// -------------------------
// STORAGE
// -------------------------
const char* QUEUE_FILE = "/queue.txt";
const char* TMP_QUEUE_FILE = "/queue_tmp.txt";

// -------------------------
// RTC RETAINED DATA
// -------------------------
RTC_DATA_ATTR uint32_t wakeCounter = 0;
RTC_DATA_ATTR bool rtcTimeValid = false;
RTC_DATA_ATTR time_t rtcEpochAnchor = 0;
RTC_DATA_ATTR uint32_t rtcAnchorWakeCounter = 0;

// -------------------------
// PINS
// -------------------------
const int SOIL_PIN = 0;
const int DHT_PIN  = 1;
const int SDA_PIN  = 2;
const int SCL_PIN  = 3;

// -------------------------
// SENSORS
// -------------------------
#define DHTTYPE DHT22
DHT dht(DHT_PIN, DHTTYPE);
BH1750 lightMeter;

// -------------------------
// SOIL CALIBRATION
// Adjust with your real dry/wet readings
// -------------------------
const int SOIL_RAW_WET = 1400;
const int SOIL_RAW_DRY = 3700;

struct SensorReading {
  float tempC;
  float humAir;
  int soilRaw;
  int soilPercent;
  float lux;
  bool validDht;
  bool validBh1750;
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

float roundTo2(float value) {
  return roundf(value * 100.0f) / 100.0f;
}

bool initStorage() {
  if (!LittleFS.begin(true)) {
    logLine("[FS] Failed to mount LittleFS");
    return false;
  }
  logLine("[FS] LittleFS mounted");
  return true;
}

bool queueFileExists() {
  return LittleFS.exists(QUEUE_FILE);
}

int countQueuedPayloads() {
  if (!queueFileExists()) return 0;

  File file = LittleFS.open(QUEUE_FILE, FILE_READ);
  if (!file) return 0;

  int count = 0;
  while (file.available()) {
    String line = file.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) count++;
  }

  file.close();
  return count;
}

bool appendPayloadToQueue(const String& payload) {
  File file = LittleFS.open(QUEUE_FILE, FILE_APPEND);
  if (!file) {
    logLine("[FS] Failed to open queue file for append");
    return false;
  }

  file.println(payload);
  file.close();
  logLine("[FS] Payload queued successfully");
  return true;
}

void printQueueStatus() {
  Serial.print("[FS] Pending payloads: ");
  Serial.println(countQueuedPayloads());
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    logLine("[WiFi] Already connected");
    return;
  }

  logLine("[WiFi] Connecting...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_TIMEOUT_MS) {
    delay(250);
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
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect(true, true);
    delay(100);
  }
  WiFi.mode(WIFI_OFF);
  logLine("[WiFi] Disconnected");
}

bool syncTimeWithNtp() {
  if (!ENABLE_NTP_TIME || WiFi.status() != WL_CONNECTED) return false;

  logLine("[NTP] Syncing time...");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");

  struct tm timeinfo;
  for (int i = 0; i < 12; i++) {
    if (getLocalTime(&timeinfo, 1000)) {
      time_t nowEpoch;
      time(&nowEpoch);

      rtcTimeValid = true;
      rtcEpochAnchor = nowEpoch;
      rtcAnchorWakeCounter = wakeCounter;

      logLine("[NTP] Time synchronized");
      Serial.print("[NTP] Epoch anchor: ");
      Serial.println((unsigned long)rtcEpochAnchor);
      return true;
    }
  }

  logLine("[NTP] Time sync failed");
  return false;
}

bool hasValidAnchoredTime() {
  return rtcTimeValid && rtcEpochAnchor > 1704067200; // >= 2024-01-01
}

time_t getAnchoredEpochForCurrentCycle() {
  if (!hasValidAnchoredTime()) return 0;

  uint32_t cyclesSinceAnchor = wakeCounter - rtcAnchorWakeCounter;
  uint64_t secondsOffset = (uint64_t)cyclesSinceAnchor * (uint64_t)SLEEP_MINUTES * 60ULL;
  return rtcEpochAnchor + (time_t)secondsOffset;
}

String formatEpochAsIsoUtc(time_t epochValue) {
  if (epochValue <= 0) return "";

  struct tm timeinfo;
  if (gmtime_r(&epochValue, &timeinfo) == nullptr) {
    return "";
  }

  char buffer[32];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

String getEstimatedIsoTimestampUtc() {
  return formatEpochAsIsoUtc(getAnchoredEpochForCurrentCycle());
}

void enterDeepSleepMinutes(uint64_t minutes) {
  uint64_t sleepUs = minutes * 60ULL * 1000000ULL;
  Serial.printf("[SLEEP] Entering deep sleep for %llu minute(s)\n", minutes);
  Serial.flush();
  esp_sleep_enable_timer_wakeup(sleepUs);
  esp_deep_sleep_start();
}

SensorReading readSensors() {
  SensorReading reading;

  reading.tempC = dht.readTemperature();
  reading.humAir = dht.readHumidity();
  reading.validDht = !(isnan(reading.tempC) || isnan(reading.humAir));

  reading.soilRaw = analogRead(SOIL_PIN);
  reading.soilPercent = mapSoilRawToPercent(reading.soilRaw);

  reading.lux = lightMeter.readLightLevel();
  reading.validBh1750 = !(reading.lux < 0);

  return reading;
}

void addValue(JsonArray values, const char* type, float value, const char* unit) {
  JsonObject item = values.createNestedObject();
  item["type"] = type;
  item["value"] = roundTo2(value);
  item["unit"] = unit;
}

String buildSingleReadingJson(const SensorReading& reading, const String& ts) {
  DynamicJsonDocument doc(1024);

  doc["deviceCode"] = DEVICE_CODE;
  doc["deviceSecret"] = DEVICE_SECRET;
  doc["readAt"] = ts;
  doc["source"] = SOURCE;

  JsonArray values = doc.createNestedArray("values");

  if (reading.validDht) {
    addValue(values, "temperature", reading.tempC, "celsius");
    addValue(values, "air_humidity", reading.humAir, "percent");
  }

  addValue(values, "soil_raw", (float)reading.soilRaw, "raw");
  addValue(values, "soil_moisture", (float)reading.soilPercent, "percent");

  if (reading.validBh1750) {
    addValue(values, "light", reading.lux, "lux");
  }

  String payload;
  serializeJson(doc, payload);
  return payload;
}

bool postJsonOnce(const String& payload) {
  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  if (!http.begin(client, API_URL)) {
    logLine("[HTTP] begin() failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Connection", "close");

  logLine("[HTTP] POST reading");
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

bool flushQueueToApi() {
  if (!queueFileExists()) {
    logLine("[FS] No queue file found. Nothing to upload.");
    return true;
  }

  File inFile = LittleFS.open(QUEUE_FILE, FILE_READ);
  if (!inFile) {
    logLine("[FS] Failed to open queue file for reading");
    return false;
  }

  File tmpFile = LittleFS.open(TMP_QUEUE_FILE, FILE_WRITE);
  if (!tmpFile) {
    logLine("[FS] Failed to open temp queue file");
    inFile.close();
    return false;
  }

  bool allSent = true;
  int sentCount = 0;
  int remainingCount = 0;

  while (inFile.available()) {
    String line = inFile.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    bool sent = postJsonOnce(line);

    if (!sent) {
      allSent = false;
      tmpFile.println(line);
      remainingCount++;

      while (inFile.available()) {
        String remaining = inFile.readStringUntil('\n');
        remaining.trim();
        if (remaining.length() > 0) {
          tmpFile.println(remaining);
          remainingCount++;
        }
      }
      break;
    }

    sentCount++;
  }

  inFile.close();
  tmpFile.close();

  LittleFS.remove(QUEUE_FILE);

  if (remainingCount > 0) {
    LittleFS.rename(TMP_QUEUE_FILE, QUEUE_FILE);
  } else {
    LittleFS.remove(TMP_QUEUE_FILE);
  }

  Serial.print("[FS] Sent payloads: ");
  Serial.println(sentCount);
  Serial.print("[FS] Remaining payloads: ");
  Serial.println(remainingCount);

  return allSent;
}

void printReading(const SensorReading& reading, const String& ts) {
  logLine("[SENSORS] Reading captured");
  Serial.print("  readAt: ");
  Serial.println(ts);

  if (reading.validDht) {
    Serial.print("  temperature: ");
    Serial.println(reading.tempC);
    Serial.print("  air_humidity: ");
    Serial.println(reading.humAir);
  } else {
    logLine("  DHT22 read failed");
  }

  Serial.print("  soil_raw: ");
  Serial.println(reading.soilRaw);
  Serial.print("  soil_moisture: ");
  Serial.println(reading.soilPercent);

  if (reading.validBh1750) {
    Serial.print("  light: ");
    Serial.println(reading.lux);
  } else {
    logLine("  BH1750 read failed");
  }
}

void setup() {
  Serial.begin(115200);
  delay(2000);

  logLine("========================================");
  logLine("ESP32-C3 Greenlytics Firmware");
  logLine("========================================");

  wakeCounter++;
  Serial.print("[BOOT] Wake counter: ");
  Serial.println(wakeCounter);

  analogReadResolution(12);

  dht.begin();

  Wire.begin(SDA_PIN, SCL_PIN);
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    logLine("[BH1750] Sensor initialized");
  } else {
    logLine("[BH1750] Sensor initialization failed");
  }

  if (!initStorage()) {
    logLine("[FATAL] Unable to initialize LittleFS");
    if (USE_DEEP_SLEEP) {
      enterDeepSleepMinutes(SLEEP_MINUTES);
    }
    return;
  }

  bool shouldUpload = (wakeCounter % UPLOAD_EVERY_N_CYCLES == 0);
  bool shouldSyncNtp = (!hasValidAnchoredTime()) || (wakeCounter % NTP_SYNC_EVERY_N_CYCLES == 0);

  bool wifiConnectedThisBoot = false;
  bool wifiNeeded = shouldUpload || shouldSyncNtp;

  if (wifiNeeded) {
    connectWiFi();
    wifiConnectedThisBoot = (WiFi.status() == WL_CONNECTED);

    if (wifiConnectedThisBoot && shouldSyncNtp) {
      syncTimeWithNtp();
    }
  }

  if (!hasValidAnchoredTime()) {
    logLine("[TIME] No valid time available");
    if (wifiConnectedThisBoot) {
      disconnectWiFi();
    }

    if (USE_DEEP_SLEEP) {
      enterDeepSleepMinutes(INITIAL_TIME_RETRY_MINUTES);
    }
    return;
  }

  SensorReading reading = readSensors();
  String ts = getEstimatedIsoTimestampUtc();

  printReading(reading, ts);

  String payload = buildSingleReadingJson(reading, ts);
  if (!appendPayloadToQueue(payload)) {
    logLine("[RESULT] Failed to queue reading locally");
  }

  printQueueStatus();

  if (shouldUpload) {
    logLine("[UPLOAD] Upload cycle enabled");

    if (WiFi.status() == WL_CONNECTED) {
      bool uploadOk = flushQueueToApi();
      if (uploadOk) {
        logLine("[RESULT] Queue sent successfully");
      } else {
        logLine("[RESULT] Queue not fully sent");
      }
    } else {
      logLine("[UPLOAD] Skipped because WiFi connection failed");
    }
  } else {
    logLine("[UPLOAD] Skipped this cycle to save battery");
  }

  if (wifiConnectedThisBoot) {
    disconnectWiFi();
  }

  if (USE_DEEP_SLEEP) {
    enterDeepSleepMinutes(SLEEP_MINUTES);
  }
}

void loop() {
  delay(1000);
}