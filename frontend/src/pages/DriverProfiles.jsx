
import { useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/PageLayout";

export default function DriverProfiles() {
  const [search, setSearch] = useState("");

  const drivers = [
    { id: 1, name: "Juan Dela Cruz", license: "N01-23-456789", jeepney: "001" },
    { id: 2, name: "Pedro Santos", license: "N01-23-456790", jeepney: "002" },
    { id: 3, name: "Mario Reyes", license: "N01-23-456791", jeepney: "003" },
    { id: 4, name: "Ramon Cruz", license: "N01-23-456792", jeepney: "Unassigned" },
  ];

  const filtered = drivers.filter((driver) =>
    driver.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageLayout title="Driver Profiles">
      <div className="toolbar">
        <input
          placeholder="Search driver..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Link to="/drivers/add" className="btn btn-yellow">
          + Add
        </Link>
      </div>

      {filtered.map((driver) => (
        <div className="record-card" key={driver.id}>
          <div className="avatar">👤</div>
          <div>
            <strong>{driver.name}</strong>
            <small>
              Lic: {driver.license} | Jeep: {driver.jeepney}
            </small>
          </div>
        </div>
      ))}

      <p className="page-note">
        Tap a driver to view, edit, or remove.
      </p>
    </PageLayout>
  );
}
