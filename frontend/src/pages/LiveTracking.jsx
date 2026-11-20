
import { useEffect, useRef, useState } from "react";
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
import { Field } from "../components/FleetOptions";
import RecordsFeedback from "../components/RecordsFeedback";
import { api } from "../api";
import { useResource } from "../hooks";

import "leaflet/dist/leaflet.css";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DEFAULT_POSITION = [15.179, 120.589];

const jeepneyIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function MapController({ position, centerRequest }) {
  const map = useMap();
  const lastCenterRequest = useRef(null);
  const latitude = position?.[0];
  const longitude = position?.[1];

  useEffect(() => {
    if (latitude != null && longitude != null && lastCenterRequest.current !== centerRequest) {
      lastCenterRequest.current = centerRequest;
      map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
        duration: 0.8,
      });
    }
  }, [centerRequest, latitude, longitude, map]);

  return null;
}

export default function LiveTracking() {
  const units = useResource("jeepneys/");
  const [unitId, setUnitId] = useState("");
  return (
    <PageLayout title="Live GPS Map" description="Last reported positions and speeds for your jeepneys">
      <RecordsFeedback resources={[units]} />
      {units.data?.length > 0 && (
        <div className="toolbar">
          <Field label="Jeepney">
            <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
              <option value="">Latest fleet report</option>
              {units.data.map((unit) => <option key={unit.id} value={unit.id}>Unit {unit.unit_no}</option>)}
            </select>
          </Field>
        </div>
      )}
      <TrackingPanel key={unitId} unitId={unitId} />
    </PageLayout>
  );
}

function TrackingPanel({ unitId }) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [centerRequest, setCenterRequest] = useState(0);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const path = "tracking/latest/" + (unitId ? "?jeepney_id=" + encodeURIComponent(unitId) : "");
    let nextCheck;

    async function fetchLocation() {
      try {
        const data = await api(path, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (data.latitude == null || data.longitude == null) {
          setLocation(null);
        } else {
          const latitude = Number(data.latitude);
          const longitude = Number(data.longitude);
          if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
              Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
            throw new Error("Invalid GPS coordinates received.");
          }
          setLocation({ ...data, latitude, longitude });
        }
        setError("");
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) {
          setLastChecked(new Date());
          setLoading(false);
          nextCheck = setTimeout(fetchLocation, 5000);
        }
      }
    }

    fetchLocation();
    return () => {
      controller.abort();
      clearTimeout(nextCheck);
    };
  }, [unitId, revision]);

  const position = location
    ? [Number(location.latitude), Number(location.longitude)]
    : null;

  const reportTime = location?.recorded_at
    ? new Date(location.recorded_at)
    : null;

  const reportAge = reportTime && lastChecked
    ? lastChecked.getTime() - reportTime.getTime()
    : null;

  const isRecent =
    reportAge !== null &&
    reportAge >= 0 &&
    reportAge < 60000;

  const status = !location
    ? (loading ? "Checking for GPS reports…" : "No GPS reports yet")
    : isRecent
      ? "Recent GPS report"
      : "Last report is old";

  return (
    <div className="gps-workspace">
        <aside className="gps-details">
          <div className="gps-vehicle">
            <div className="gps-vehicle-icon">
              <BusFront size={26} />
            </div>
            <div>
              <small>Tracked jeepney</small>
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
              <MapPinned size={16} aria-hidden="true" />
              Vehicle location
            </span>
            <button
              className="gps-refresh"
              onClick={() => {
                setLoading(true);
                setRevision((current) => current + 1);
              }}
              disabled={loading}
            >
              <RefreshCw size={15} aria-hidden="true" />
              {loading ? "Refreshing…" : "Refresh"}
            </button>
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
  );
}
