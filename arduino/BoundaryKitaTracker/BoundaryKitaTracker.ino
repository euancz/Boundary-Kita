#include <Arduino.h>
#include <HTTPClient.h>
#include <TinyGPSPlus.h>
#include <WiFi.h>

TinyGPSPlus gps;

#define GPS_RX 16
#define GPS_TX 17

// Edit these settings before uploading.
const char *WIFI_SSID = "Iphigenia";
const char *WIFI_PASSWORD = "Th1$n0+4Y0upL3@$e";
const char *TRACKER_URL = "http://192.168.254.96:8000/api/tracking/location/";
const char *TRACKER_TOKEN = "03cbc5eadd31d29e4a5a791f971f45e96652a547973549ba";
const int JEEPNEY_ID = 1;  // Use the Tracker ID shown in Jeepney Units.

const char *MAP_URL = "http://127.0.0.1:5173/tracking";  // Open this on your PC.
const unsigned long MAP_UPDATE_INTERVAL = 5000;
unsigned long lastMapUpdate = 0;

void updateBoundaryKitaMap(double latitude, double longitude) {
  const unsigned long now = millis();
  if (now - lastMapUpdate < MAP_UPDATE_INTERVAL) {
    return;
  }
  lastMapUpdate = now;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Map update skipped: ESP32 is waiting for Wi-Fi.");
    return;
  }

  WiFiClient client;
  HTTPClient http;
  if (!http.begin(client, TRACKER_URL)) {
    Serial.println("Could not open TRACKER_URL.");
    return;
  }

  http.setConnectTimeout(1500);
  http.setTimeout(2000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Tracker-Token", TRACKER_TOKEN);

  char json[112];
  snprintf(json, sizeof(json),
           "{\"jeepney_id\":%d,\"latitude\":%.7f,\"longitude\":%.7f}",
           JEEPNEY_ID, latitude, longitude);
  const int status = http.POST(String(json));
  http.end();

  if (status == 201) {
    Serial.print("HTTP 201 - Boundary-Kita Live GPS Map: ");
    Serial.println(MAP_URL);
  } else {
    Serial.printf("Map update failed (HTTP result %d).\n", status);
  }
}

void setup() {
  Serial.begin(115200);
  Serial2.setRxBufferSize(4096);
  Serial2.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);

  Serial.println("GPS Starting...");

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  lastMapUpdate = millis() - MAP_UPDATE_INTERVAL;
}

void loop() {
  while (Serial2.available() > 0) {
    gps.encode(Serial2.read());
  }

  if (gps.location.isUpdated() && gps.location.isValid()) {
    const double latitude = gps.location.lat();
    const double longitude = gps.location.lng();

    Serial.print("Latitude: ");
    Serial.println(latitude, 6);
    Serial.print("Longitude: ");
    Serial.println(longitude, 6);
    Serial.print("Satellites: ");
    Serial.println(gps.satellites.value());

    updateBoundaryKitaMap(latitude, longitude);
    Serial.println("--------------------");
  }

  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("No GPS data. Check wiring!");
    delay(2000);
  }
}
