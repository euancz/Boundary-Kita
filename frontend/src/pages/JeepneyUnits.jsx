import { useState } from "react";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { Field } from "../components/FleetOptions";
import { api } from "../api";
import { useAction, useResource } from "../hooks";

const statuses = ["active", "inactive", "maintenance"];

export default function JeepneyUnits() {
  const units = useResource("jeepneys/");
  const routes = useResource("routes/");
  const action = useAction();
  const [editing, setEditing] = useState(null);

  function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.route = body.route ? Number(body.route) : null;
    action.run(async () => {
      await api(editing.id ? "jeepneys/" + editing.id + "/" : "jeepneys/", {
        method: editing.id ? "PATCH" : "POST", body,
      });
      setEditing(null);
      units.reload();
    }, "Jeepney saved.");
  }

  function archive(unit) {
    if (!window.confirm("Archive unit " + unit.unit_no + "? Existing records will be kept.")) return;
    action.run(async () => {
      await api("jeepneys/" + unit.id + "/", { method: "DELETE" });
      setEditing(null);
      units.reload();
    }, "Jeepney archived.");
  }

  return (
    <PageLayout title="Jeepney Units">
      <div className="toolbar toolbar-end">
        <button className="btn btn-yellow" onClick={() => setEditing({})}>+ Add Jeepney</button>
      </div>
      <RecordsFeedback action={action} resources={[units, routes]} />
      {editing && routes.data && (
        <form className="storyboard-form management-form" key={editing.id || "new"} onSubmit={save}>
          <h3>{editing.id ? "Edit Jeepney" : "Add Jeepney"}</h3>
          <Field label="Unit number"><input name="unit_no" defaultValue={editing.unit_no} maxLength={50} required /></Field>
          <Field label="Plate number"><input name="plate_no" defaultValue={editing.plate_no} maxLength={50} required /></Field>
          <Field label="Status">
            <select name="status" defaultValue={editing.status || "active"}>
              {editing.status && !statuses.includes(editing.status) && (
                <option value={editing.status}>{editing.status}</option>
              )}
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Route">
            <select name="route" defaultValue={editing.route || ""}>
              <option value="">Unassigned</option>
              {routes.data.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
            </select>
          </Field>
          <div className="form-actions">
            <button className="btn btn-navy" disabled={action.busy}>Save jeepney</button>
            <button className="btn btn-gray" type="button" onClick={() => setEditing(null)} disabled={action.busy}>Cancel</button>
          </div>
        </form>
      )}
      {units.data?.length === 0 && <p className="empty-state">No jeepneys registered.</p>}
      {units.data?.map((unit) => (
        <article className="record-card management-record" key={unit.id}>
          <div>
            <strong>Unit {unit.unit_no} · {unit.plate_no}</strong>
            <small>{unit.route_name || "No assigned route"}</small>
            <small>Tracker ID: {unit.id}</small>
          </div>
          <div className="record-actions">
            <span className={"status-label unit-status " + (
              unit.status === "active" ? "status-paid" : unit.status === "maintenance" ? "status-unpaid" : "status-neutral"
            )}>{unit.status}</span>
            <button className="btn btn-gray" disabled={action.busy} onClick={() => setEditing(unit)}>Edit</button>
            <button className="btn btn-red" disabled={action.busy} onClick={() => archive(unit)}>Archive</button>
          </div>
        </article>
      ))}
    </PageLayout>
  );
}
