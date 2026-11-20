import { useState } from "react";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { Field, JeepneySelect } from "../components/FleetOptions";
import { api, pesos } from "../api";
import { useAction, useResource } from "../hooks";

export default function JeepneyRoutes() {
  const routes = useResource("routes/");
  const units = useResource("jeepneys/");
  const action = useAction();
  const [editing, setEditing] = useState(null);

  function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    action.run(async () => {
      await api(editing.id ? "routes/" + editing.id + "/" : "routes/", {
        method: editing.id ? "PATCH" : "POST", body,
      });
      setEditing(null);
      routes.reload();
      units.reload();
    }, "Route saved.");
  }

  function assign(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    action.run(async () => {
      await api("jeepneys/" + body.get("jeepney") + "/", {
        method: "PATCH", body: { route: Number(body.get("route")) },
      });
      form.reset();
      units.reload();
    }, "Route assigned.");
  }

  function remove(route) {
    if (!window.confirm("Remove route " + route.name + "?")) return;
    action.run(async () => {
      await api("routes/" + route.id + "/", { method: "DELETE" });
      setEditing(null);
      routes.reload();
    }, "Route removed.");
  }

  return (
    <PageLayout title="Jeepney Routes">
      <div className="toolbar toolbar-end">
        <button className="btn btn-yellow" disabled={action.busy} onClick={() => setEditing({})}>+ Add Route</button>
      </div>
      <RecordsFeedback action={action} resources={[routes, units]} />
      {editing && (
        <form className="storyboard-form management-form" key={editing.id || "new"} onSubmit={save}>
          <h3>{editing.id ? "Edit Route" : "Add Route"}</h3>
          <Field label="Route name"><input name="name" defaultValue={editing.name} maxLength={120} required /></Field>
          <Field label="Fare (PHP)"><input name="fare" type="number" min="0" max="999999.99" step="0.01" defaultValue={editing.fare} required /></Field>
          <Field label="Distance (km)"><input name="distance" type="number" min="0.01" max="999999.99" step="0.01" defaultValue={editing.distance} required /></Field>
          <div className="form-actions">
            <button className="btn btn-navy" disabled={action.busy}>Save route</button>
            <button className="btn btn-gray" type="button" onClick={() => setEditing(null)} disabled={action.busy}>Cancel</button>
          </div>
        </form>
      )}
      {routes.data?.length === 0 && <p className="empty-state">No routes registered.</p>}
      {routes.data?.map((route) => (
        <article className="record-card management-record" key={route.id}>
          <div>
            <strong>{route.name}</strong>
            <small>Fare {pesos(route.fare)} · {Number(route.distance)} km</small>
            <small>{units.data?.filter((unit) => unit.route === route.id)
              .map((unit) => "Unit " + unit.unit_no).join(", ") || "No assigned jeepneys"}</small>
          </div>
          <div className="record-actions">
            <button className="btn btn-gray" disabled={action.busy} onClick={() => setEditing(route)}>Edit</button>
            <button className="btn btn-red" disabled={action.busy} onClick={() => remove(route)}>Remove</button>
          </div>
        </article>
      ))}
      {units.data?.length > 0 && routes.data?.length > 0 && (
        <form className="storyboard-form assignment-form" onSubmit={assign}>
          <h3>Assign route to a jeepney</h3>
          <JeepneySelect units={units.data} required />
          <Field label="Route">
            <select name="route" defaultValue="" required>
              <option value="">Select a route</option>
              {routes.data.map((route) => <option key={route.id} value={route.id}>{route.name}</option>)}
            </select>
          </Field>
          <button className="btn btn-navy" disabled={action.busy}>Assign route</button>
        </form>
      )}
    </PageLayout>
  );
}
