# Boundary-Kita

Boundary-Kita is a jeepney operator dashboard for driver profiles, fleet and route assignments, boundary payments, borrow requests, and GPS tracking.

## Run locally

Use Python 3.14 and Node.js 24. Open two PowerShell terminals in the `BOUNDARY-KITA` folder and keep both running.

**Terminal 1 · Django**

```powershell
cd backend
$env:PYTHONDONTWRITEBYTECODE = "1"
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

**Terminal 2 · React**

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

If you're already at a `BOUNDARY-KITA\frontend>` prompt and `npm.cmd ci` finished, run `npm.cmd run dev`. On later runs, you can skip dependency installation unless the dependencies have changed.

Open [Boundary-Kita](http://127.0.0.1:5173) once Vite shows its local URL. Port `5173` serves the app and port `8000` serves Django. If the login page can't reach Django, check that Terminal 1 is still running. If a port is already in use, check whether Boundary-Kita is already running before starting another copy.

Sign in with a Django account. To create one, run `python manage.py createsuperuser` from `backend` in a separate terminal. The Django admin is at [127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/).

The migration preserves existing jeepneys, GPS reports, and users in `backend/db.sqlite3`. If you want a separate SQLite database, set the `BOUNDARY_SQLITE_PATH` environment variable to its absolute path before running Django's migration and server commands.

## Operator workflows

- Register jeepneys, then create routes and assign them to units. The jeepney list displays the numeric tracker ID.
- Add drivers, optionally upload a photo, and assign a unit. Archiving a driver or unit preserves records that reference it.
- Enter one boundary per jeepney per date. Mark a boundary paid when money is received, either during entry or later. The dashboard counts payments received today in Philippine time.
- Enter a driver's borrow request and approve or decline it. A decision records the operator's response. Driver assignments are edited from the driver profile.
- Open Live GPS Map to view the latest fleet report or filter by jeepney. The map checks for fresh reports about every five seconds.

## Connect the ESP32 GPS tracker

Open [BoundaryKitaTracker.ino](arduino/BoundaryKitaTracker/BoundaryKitaTracker.ino) in Arduino IDE. Install **esp32 by Espressif Systems** in Boards Manager and **TinyGPSPlus by Mikal Hart** in Library Manager. Select your ESP32 board and USB port.

If Boards Manager does not list Espressif's package, add its stable package URL under **File → Preferences → Additional Boards Manager URLs**. See the [Espressif installation guide](https://docs.espressif.com/projects/arduino-esp32/en/latest/installing.html).

The ESP32 uses its built-in Wi-Fi. Wire the NEO-6M to the ESP32 as follows.

| NEO-6M pin | ESP32 connection |
| --- | --- |
| TX | GPIO 16 (ESP32 RX) |
| RX | GPIO 17 (ESP32 TX), optional for receiving GPS reports |
| GND | GND |
| VCC | Use the supply voltage specified for your breakout board. The bare NEO-6M module is rated for 2.7–3.6 V. |

The sketch uses 9600 baud for GPS and 115200 baud for Serial Monitor. Change `GPS_RX` or `GPS_TX` only if you wire a different pair of pins. [u-blox NEO-6 datasheet](https://content.u-blox.com/sites/default/files/products/documents/NEO-6_DataSheet_%28GPS.G6-HW-09005%29.pdf)

Edit these settings at the top of the sketch. Keep the ESP32 and the computer on the same local network.

| Setting | Where to find the value |
| --- | --- |
| `WIFI_SSID` | The Wi-Fi network name shown in Windows Wi-Fi settings. Use a 2.4 GHz network for a classic ESP32. |
| `WIFI_PASSWORD` | The password for that Wi-Fi network. |
| `TRACKER_URL` | Run `ipconfig` on the computer and look under **Wireless LAN adapter Wi-Fi** for **IPv4 Address**. Put it in `http://<IPv4 Address>:8000/api/tracking/location/`. |
| `TRACKER_TOKEN` | Choose a random token and use the same value for Django's `TRACKER_API_TOKEN` below. |
| `JEEPNEY_ID` | The numeric **Tracker ID** shown under **Jeepney Units**. |

To make a tracker token, run `python -c "import secrets; print(secrets.token_hex(24))"` in PowerShell. Copy that value into the sketch's `TRACKER_TOKEN` and into Django's environment.

Stop the existing Django development server, then start it from `backend` with the LAN IP and the same token you put in the sketch. Replace the example IP with the computer's current IP if it differs.

```powershell
$env:DJANGO_ALLOWED_HOSTS = "localhost,127.0.0.1,192.168.254.96"
$env:TRACKER_API_TOKEN = "YOUR_TRACKER_TOKEN"
python -B manage.py runserver 0.0.0.0:8000
```

Upload the sketch and open **Serial Monitor** at **115200 baud**. When the GPS has a fresh position fix, the tracker sends it about every five seconds. `HTTP 201` means Django saved the report. Select the jeepney in **Live GPS Map** to see it. `HTTP 401` means the tracker token differs or is missing. `HTTP 404` means Django could not find the registered unit or endpoint. If the ESP32 connects to Wi-Fi but the request times out, check the PC's IP and whether Windows Firewall allows Python on the private network.

### Tracker API

Set `TRACKER_API_TOKEN` in the Django server's environment before startup. When the tracker is ready, send an HTTP `POST` to `/api/tracking/location/` with `Content-Type: application/json` and the token in the `X-Tracker-Token` header. Use the numeric Tracker ID shown in Jeepney Units, latitude and longitude in decimal degrees, and optional speed in km/h. A successful submission returns HTTP 201.

Example PowerShell request:

```powershell
$headers = @{ "X-Tracker-Token" = $env:TRACKER_API_TOKEN }
$report = @{
    jeepney_id = 1
    latitude = 15.4834123
    longitude = 120.5931478
    speed = 14.5
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/tracking/location/" -Headers $headers -ContentType "application/json" -Body $report
```

This sample writes a report for the given unit. The map's latest-location API uses the operator's Django session. The tracker uses its own token. The sketch's HTTP URL is for local network testing.
