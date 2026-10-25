
import { useState } from "react";
import PageLayout from "../components/PageLayout";

export default function JeepneyRoutes() {
  const [jeepney, setJeepney] = useState("");
  const [route, setRoute] = useState("");

  const routes = [
    { id: 1, name: "Tarlac City - Capas", fare: 25, distance: 18 },
    { id: 2, name: "Tarlac City - Concepcion", fare: 30, distance: 22 },
    { id: 3, name: "Tarlac City - Paniqui", fare: 35, distance: 28 },
  ];

  function assignRoute(e) {
    e.preventDefault();
    alert("Route assignment will be saved through Django later.");
  }

  return (
    <PageLayout title="Jeepney Routes">
      <div className="toolbar toolbar-end">
        <button
          className="btn btn-yellow"
          onClick={() => alert("Add Route form coming next.")}
        >
          + Add Route
        </button>
      </div>

      {routes.map((item) => (
        <div className="record-card" key={item.id}>
          <div>
            <strong>{item.name}</strong>
            <small>
              Fare: ₱{item.fare} | {item.distance} km
            </small>
          </div>
        </div>
      ))}

      <form className="storyboard-form assignment-form" onSubmit={assignRoute}>
        <h3>Assign route to a jeepney</h3>

        <select
          value={jeepney}
          onChange={(e) => setJeepney(e.target.value)}
          required
        >
          <option value="">Select jeepney</option>
          <option value="1">Unit 001</option>
          <option value="2">Unit 002</option>
          <option value="3">Unit 003</option>
        </select>

        <select
          value={route}
          onChange={(e) => setRoute(e.target.value)}
          required
        >
          <option value="">Select route</option>
          {routes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>

        <button type="submit" className="btn btn-navy">
          ASSIGN
        </button>
      </form>
    </PageLayout>
  );
}
