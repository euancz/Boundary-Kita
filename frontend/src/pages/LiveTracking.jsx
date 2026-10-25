
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import {
  BusFront,
  MapPinned,
  Gauge,
  Clock3,
  LocateFixed,
  RefreshCw,
  Navigation,
  Wifi,
  WifiOff,
} from "lucide-react";

import PageLayout from "../components/PageLayout";

import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_POSITION = [15.22, 120.58];

const jeepneyIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapController({ position, centerRequest }) {
  const map = useMap();

  useEffect(() => {
    if (position && centerRequest > 0) {
      map.flyTo(position, Math.max(map.getZoom(), 15), {
        duration: 0.8,
      });
    }
  }, [centerRequest, map]);

  return null;
}

export default function LiveTracking() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);
  const [centerRequest, setCenterRequest] = useState(0);

  async function fetchLocation() {
    setLoading(true);

    try {
      const response = await fetch("/api/tracking/latest/");

      if (!response.ok) {
        throw new Error("Unable to retrieve GPS data");
      }

      const data = await response.json();

      if (data.latitude == null || data.longitude == null) {
        setLocation(null);
        setError("No GPS data available yet.");
        return;
      }

      const lat = Number(data.latitude);
      const lng = Number(data.longitude);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      ) {
        throw new Error("Invalid GPS coordinates received");
      }

      setLocation(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLastChecked(new Date());
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocation();

    const interval = setInterval(fetchLocation, 5000);

    return () => clearInterval(interval);
  }, []);

  const position = location
    ? [Number(location.latitude), Number(location.longitude)]
    : null;

  const reportTime = location?.recorded_at
    ? new Date(location.recorded_at)
    : null;

  const reportAge = reportTime
    ? Date.now() - reportTime.getTime()
    : null;

  const isRecent =
    reportAge !== null &&
    reportAge >= 0 &&
    reportAge < 60000;

  const status = !location
    ? "No GPS data"
    : isRecent
      ? "Recent GPS report"
      : "Last report is old";

  return (
    <PageLayout title="Live GPS Map">
      <div className="gps-heading">
        <div>
          <h2>Live Vehicle Tracking</h2>
          <p>
            Monitor the latest jeepney location and GPS reports.
          </p>
        </div>

        <button
          className="gps-refresh"
          onClick={fetchLocation}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="gps-workspace">
        <aside className="gps-details">
          <div className="gps-vehicle">
            <div className="gps-vehicle-icon">
              <BusFront size={26} />
            </div>
            <div>
              <small>TRACKED JEEPNEY</small>
              <h3>{location?.jeepney || "No vehicle data"}</h3>
            </div>
          </div>

          <div className="gps-status">
            {isRecent ? (
              <Wifi size={17} />
            ) : (
              <WifiOff size={17} />
            )}
            <span>{status}</span>
          </div>

          <div className="gps-detail-card">
            <div className="gps-detail-icon">
              <Gauge size={21} />
            </div>
            <div>
              <small>Reported Speed</small>
              <strong>
                {location ? location.speed : "--"} km/h
              </strong>
            </div>
          </div>

          <div className="gps-detail-card">
            <div className="gps-detail-icon">
              <MapPinned size={21} />
            </div>
            <div>
              <small>GPS Coordinates</small>
              <strong>
                {position
                  ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`
                  : "Unavailable"}
              </strong>
            </div>
          </div>

          <div className="gps-detail-card">
            <div className="gps-detail-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <small>Last GPS Report</small>
              <strong>
                {reportTime && !isNaN(reportTime.getTime())
                  ? reportTime.toLocaleString()
                  : "Unavailable"}
              </strong>
            </div>
          </div>

          <button
            className="gps-center-btn"
            onClick={() => setCenterRequest((n) => n + 1)}
            disabled={!position}
          >
            <LocateFixed size={18} />
            Center on Jeepney
          </button>

          <div className="gps-footer-info">
            <Navigation size={16} />
            <span>
              {lastChecked
                ? `Last API check: ${lastChecked.toLocaleTimeString()}`
                : "Waiting for GPS API"}
            </span>
          </div>

          {error && (
            <p className="gps-error" role="alert">
              {error}
            </p>
          )}
        </aside>

        <div className="gps-map-panel">
          <div className="gps-map-toolbar">
            <span>
              <MapPinned size={16} />
              Vehicle Location
            </span>
            <span>OpenStreetMap</span>
          </div>

          <MapContainer
            center={DEFAULT_POSITION}
            zoom={14}
            className="gps-leaflet-map"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {position && (
              <Marker position={position} icon={jeepneyIcon}>
                <Popup>
                  <strong>{location.jeepney}</strong>
                  <p>Speed: {location.speed} km/h</p>
                  <p>
                    Reported:{" "}
                    {reportTime?.toLocaleString() || "Unknown"}
                  </p>
                </Popup>
              </Marker>
            )}

            <MapController
              position={position}
              centerRequest={centerRequest}
            />
          </MapContainer>
        </div>
      </div>
    </PageLayout>
  );
}
