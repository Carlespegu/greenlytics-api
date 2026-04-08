
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <esp_sleep.h>
#include <time.h>
#include <LittleFS.h>

// =========================================================
// GREENLYTICS ESP32 FIRMWARE - VERSION 4
// Strategy:
//  - Read sensors every 30 minutes
//  - REQUIRE a valid time base before storing any reading
//  - Persist each reading locally in LittleFS as one JSON line
//  - Upload every 8 cycles (4 hours) to save battery
//  - Send queued readings in real JSON batches
// =========================================================

// -------------------------
// WIFI
// -------------------------
const char* WIFI_SSID = "MiFibra-9687";
const char* WIFI_PASSWORD = "h447xhrL";

// -------------------------
// API
// -------------------------
// Change this endpoint if your backend uses a different batch path.
const char* API_URL = "https://api.greenlytics.app/device-readings/batch";
const char* API_KEY = "7I128ji0yiT-0CROHYefMuhAjoe-XiPT8vKxDEDJVqw";
const char* DEVICE_ID = "ESP32-PLANT-001";

// -------------------------
// TIMING / POWER STRATEGY
// -------------------------
const unsigned long WIFI_TIMEOUT_MS = 8000;
const unsigned long HTTP_TIMEOUT_MS = 8000;
const uint64_t SLEEP_MINUTES = 30;
const uint64_t INITIAL_TIME_RETRY_MINUTES = 5;
const bool USE_DEEP_SLEEP = true;
const bool ENABLE_NTP_TIME = true;
const uint32_t UPLOAD_EVERY_N_CYCLES = 8;      // 8 x 30 min = every 4 hours
const uint32_t NTP_SYNC_EVERY_N_CYCLES = 48;   // every 24 hours
const size_t MAX_BATCH_RECORDS = 8;            // preferred batch size

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
  WiFi.disconnect(true, true);
  WiFi.mode(WIFI_OFF);
  btStop();
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

      logLine("[NTP] Time synchronized and RTC anchor updated");
      Serial.print("[NTP] Epoch anchor: ");
      Serial.println((unsigned long)rtcEpochAnchor);
      return true;
    }
  }

  logLine("[NTP] Time synchronization failed");
  return false;
}

bool hasValidAnchoredTime() {
  return rtcTimeValid && rtcEpochAnchor > 1704067200;  // >= 2024-01-01
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

  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

String getEstimatedIsoTimestampUtc() {
  return formatEpochAsIsoUtc(getAnchoredEpochForCurrentCycle());
}

bool ensureInitialTimeOrSleep() {
  if (hasValidAnchoredTime()) {
    return true;
  }

  logLine("[TIME] No valid time yet. Forcing initial WiFi + NTP sync...");
  connectWiFi();

  bool synced = false;
  if (WiFi.status() == WL_CONNECTED) {
    synced = syncTimeWithNtp();
  }

  disconnectWiFi();

  if (!synced) {
    logLine("[TIME] Initial time sync failed. Skipping reading and retrying soon.");
    if (USE_DEEP_SLEEP) {
      enterDeepSleepMinutes(INITIAL_TIME_RETRY_MINUTES);
    }
    return false;
  }

  logLine("[TIME] Initial time sync OK");
  return true;
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

String buildSingleReadingJson(const SensorReading& reading, const String& ts, const char* tsSource) {
  DynamicJsonDocument doc(1280);

  doc["ts"] = ts;
  doc["ts_source"] = tsSource;
  doc["device_cycle"] = wakeCounter;
  doc["sleep_minutes"] = SLEEP_MINUTES;

  JsonArray values = doc.createNestedArray("values");

  if (reading.validDht) {
    addDecimalValue(values, "temp_c", reading.tempC);
    addDecimalValue(values, "hum_air", reading.humAir);
  }

  addIntegerValue(values, "ldr_raw", reading.ldrRaw);
  addIntegerValue(values, "soil_percent", reading.soilPercent);
  addTextValue(values, "rain", reading.rain);
  addIntegerValue(values, "rssi", reading.rssi);

  String payload;
  serializeJson(doc, payload);
  return payload;
}

bool postJsonOnce(const String& payload) {
  WiFiClientSecure client;
  client.setInsecure();  // Replace with a trusted certificate in production.

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  if (!http.begin(client, API_URL)) {
    logLine("[HTTP] begin() failed");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", API_KEY);
  http.addHeader("Connection", "close");

  logLine("[HTTP] POST batch");
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

bool buildBatchPayloadFromLines(const String lines[], size_t count, String& outPayload) {
  if (count == 0) return false;

  DynamicJsonDocument doc(8192);
  doc["device_id"] = DEVICE_ID;
  doc["sent_at"] = getEstimatedIsoTimestampUtc();
  doc["batch_size"] = (int)count;

  JsonArray readings = doc.createNestedArray("readings");

  for (size_t i = 0; i < count; i++) {
    DynamicJsonDocument itemDoc(1536);
    DeserializationError err = deserializeJson(itemDoc, lines[i]);

    if (err) {
      Serial.print("[FS] Invalid queued JSON skipped in batch build: ");
      Serial.println(err.c_str());
      return false;
    }

    JsonObject src = itemDoc.as<JsonObject>();
    JsonObject dst = readings.createNestedObject();
    for (JsonPair kv : src) {
      dst[kv.key()] = kv.value();
    }
  }

  serializeJson(doc, outPayload);
  return true;
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
  String batchLines[MAX_BATCH_RECORDS];
  size_t batchCount = 0;

  while (inFile.available()) {
    String line = inFile.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;

    batchLines[batchCount++] = line;

    if (batchCount == MAX_BATCH_RECORDS) {
      String batchPayload;
      bool built = buildBatchPayloadFromLines(batchLines, batchCount, batchPayload);
      bool sent = built && postJsonOnce(batchPayload);

      if (!sent) {
        allSent = false;

        for (size_t i = 0; i < batchCount; i++) {
          tmpFile.println(batchLines[i]);
          remainingCount++;
        }

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

      sentCount += batchCount;
      batchCount = 0;
    }
  }

  if (allSent && batchCount > 0) {
    String batchPayload;
    bool built = buildBatchPayloadFromLines(batchLines, batchCount, batchPayload);
    bool sent = built && postJsonOnce(batchPayload);

    if (!sent) {
      allSent = false;
      for (size_t i = 0; i < batchCount; i++) {
        tmpFile.println(batchLines[i]);
        remainingCount++;
      }
    } else {
      sentCount += batchCount;
      batchCount = 0;
    }
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

  if (allSent) {
    logLine("[FS] Queue flushed successfully");
  } else {
    logLine("[FS] Queue partially sent. Remaining payloads preserved.");
  }

  return allSent;
}

void printReading(const SensorReading& reading, const String& ts, const char* tsSource) {
  logLine("[SENSORS] Reading captured");
  Serial.print("  ts: ");
  Serial.println(ts);
  Serial.print("  ts_source: ");
  Serial.println(tsSource);

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

  if (reading.soilRaw >= 4090) {
    logLine("[WARN] soil_raw is saturated near 4095. Check AO pin, VCC and GND.");
  }
  if (reading.ldrRaw <= 5) {
    logLine("[WARN] ldr_raw is near 0. Check divider wiring and analog output.");
  }
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
  logLine("ESP32 Greenlytics Firmware - Version 4");
  logLine("========================================");

  wakeCounter++;
  Serial.print("[BOOT] Wake counter: ");
  Serial.println(wakeCounter);

  pinMode(RAIN_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(SOIL_PIN, ADC_11db);
  analogSetPinAttenuation(LDR_PIN, ADC_11db);

  dht.begin();
  delay(2000);

  if (!initStorage()) {
    logLine("[FATAL] Unable to initialize LittleFS");
    if (USE_DEEP_SLEEP) {
      enterDeepSleepMinutes(SLEEP_MINUTES);
    }
    return;
  }

  if (!ensureInitialTimeOrSleep()) {
    return;
  }

  bool shouldUpload = (wakeCounter % UPLOAD_EVERY_N_CYCLES == 0);
  bool shouldSyncNtp = (wakeCounter % NTP_SYNC_EVERY_N_CYCLES == 0);

  SensorReading reading = readSensors();
  String ts = getEstimatedIsoTimestampUtc();
  const char* tsSource = (wakeCounter == rtcAnchorWakeCounter) ? "ntp" : "rtc_estimated";

  printReading(reading, ts, tsSource);

  String payload = buildSingleReadingJson(reading, ts, tsSource);
  if (!appendPayloadToQueue(payload)) {
    logLine("[RESULT] Failed to queue reading locally");
  }

  printQueueStatus();

  if (shouldUpload) {
    logLine("[UPLOAD] Upload cycle enabled");
    connectWiFi();

    if (WiFi.status() == WL_CONNECTED) {
      if (shouldSyncNtp) {
        syncTimeWithNtp();
      }

      bool uploadOk = flushQueueToApi();
      if (uploadOk) {
        logLine("[RESULT] Queue sent successfully");
      } else {
        logLine("[RESULT] Queue not fully sent");
      }
    } else {
      logLine("[UPLOAD] Skipped because WiFi connection failed");
    }

    disconnectWiFi();
  } else {
    logLine("[UPLOAD] Skipped this cycle to save battery");
  }

  if (USE_DEEP_SLEEP) {
    enterDeepSleepMinutes(SLEEP_MINUTES);
  }
}

void loop() {
  delay(1000);
}
