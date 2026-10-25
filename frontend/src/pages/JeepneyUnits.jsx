
import { useState } from "react";
import PageLayout from "../components/PageLayout";

export default function JeepneyUnits() {
  const [units, setUnits] = useState([
    { id: 1, plate: "ABC 1234", unit: "001", route: "Tarlac-Capas" },
    { id: 2, plate: "DEF 5678", unit: "002", route: "Tarlac-Concepcion" },
    { id: 3, plate: "GHI 9012", unit: "003", route: "Tarlac-Paniqui" },
  ]);

  const [selected, setSelected] = useState(null);

  function addJeepney() {
    alert("Add Jeepney form will be connected to Django.");
  }

  function removeJeepney() {
    if (selected === null) return;

    if (window.confirm("Remove selected jeepney from this demo?")) {
      setUnits(units.filter((unit) => unit.id !== selected));
      setSelected(null);
    }
  }

  return (
    <PageLayout title="Jeepney Units">
      <div className="toolbar toolbar-end">
        <button className="btn btn-yellow" onClick={addJeepney}>
          + Add Jeepney
        </button>
      </div>

      {units.map((unit) => (
        <div
          key={unit.id}
          className={`record-card selectable ${
            selected === unit.id ? "selected" : ""
          }`}
          onClick={() => setSelected(unit.id)}
        >
          <div>
            <strong>Plate: {unit.plate}</strong>
            <small>
              Unit {unit.unit} | Route: {unit.route}
            </small>
          </div>
        </div>
      ))}

      <div className="form-actions">
        <button
          className="btn btn-navy"
          disabled={selected === null}
          onClick={() => alert("Edit form coming next.")}
        >
          EDIT
        </button>

        <button
          className="btn btn-red"
          disabled={selected === null}
          onClick={removeJeepney}
        >
          REMOVE
        </button>
      </div>

      <p className="page-note">
        Select a unit, then Edit or Remove.
      </p>
    </PageLayout>
  );
}
