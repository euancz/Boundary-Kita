import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { DriverSelect, Field, JeepneySelect } from "../components/FleetOptions";
import { api, pesos, todayInManila } from "../api";
import { useAction, useResource } from "../hooks";

export default function BoundaryRecords() {
  const records = useResource("boundaries/");
  const drivers = useResource("drivers/");
  const units = useResource("jeepneys/");
  const action = useAction();
  const [filters, setFilters] = useSearchParams();
  const status = filters.get("status");
  const [day, setDay] = useState(todayInManila);
  const [unit, setUnit] = useState("");
  const [adding, setAdding] = useState(false);
  const unitOptions = new Map((units.data || []).map((item) => [item.id, item.unit_no]));
  for (const record of records.data || []) unitOptions.set(record.jeepney, record.unit_no);
  const filtered = (records.data || []).filter((record) =>
    (!day || record.date === day) && (!unit || String(record.jeepney) === unit)
    && (status !== "paid" || record.paid_at) && (status !== "unpaid" || !record.paid_at)
  );
  const totals = filtered.reduce((sum, record) => {
    const key = record.paid_at ? "paid" : "unpaid";
    sum[key] += Math.round(Number(record.amount) * 100);
    return sum;
  }, { paid: 0, unpaid: 0 });

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = { ...Object.fromEntries(form), paid: form.has("paid") };
    action.run(async () => {
      await api("boundaries/", { method: "POST", body });
      setDay(body.date);
      setUnit(body.jeepney);
      setFilters({});
      setAdding(false);
      records.reload();
    }, "Boundary record saved.");
  }

  function pay(record) {
    if (!window.confirm("Record payment of " + pesos(record.amount) + " for unit " + record.unit_no + "?")) return;
    action.run(async () => {
      await api("boundaries/" + record.id + "/pay/", { method: "POST" });
      records.reload();
    }, "Payment recorded.");
  }

  return (
    <PageLayout title="Boundary Records">
      <div className="toolbar">
        <Field label="Boundary date">
          <input type="date" value={day} onChange={(event) => setDay(event.target.value)} />
        </Field>
        <button type="button" className="btn btn-gray" onClick={() => setDay("")}>All dates</button>
        <Field label="Jeepney filter">
          <select value={unit} onChange={(event) => setUnit(event.target.value)}>
            <option value="">All units</option>
            {[...unitOptions].map(([id, unitNo]) => <option key={id} value={id}>Unit {unitNo}</option>)}
          </select>
        </Field>
        <Field label="Payment status">
          <select value={status === "paid" || status === "unpaid" ? status : ""}
            onChange={(event) => setFilters(event.target.value ? { status: event.target.value } : {})}>
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </Field>
        <button className="btn btn-yellow" onClick={() => setAdding(true)}
          disabled={action.busy || !drivers.data?.length || !units.data?.length}>+ Add Boundary</button>
      </div>
      <RecordsFeedback resources={[records, drivers, units]} action={action} />
      {(drivers.data?.length === 0 || units.data?.length === 0) && (
        <p className="page-note">Register a driver and a jeepney to add a boundary.</p>
      )}
      {adding && (
        <form className="storyboard-form management-form" onSubmit={save}>
          <h3>Add Boundary</h3>
          <JeepneySelect units={units.data} defaultValue={unit} required />
          <DriverSelect drivers={drivers.data} />
          <Field label="Boundary date"><input name="date" type="date" defaultValue={day || todayInManila()} required /></Field>
          <Field label="Amount (PHP)"><input name="amount" type="number" min="0.01" max="99999999.99" step="0.01" required /></Field>
          <label className="check-field"><input name="paid" type="checkbox" /> Payment received</label>
          <div className="form-actions">
            <button className="btn btn-navy" disabled={action.busy}>Save boundary</button>
            <button className="btn btn-gray" type="button" onClick={() => setAdding(false)} disabled={action.busy}>Cancel</button>
          </div>
        </form>
      )}
      {records.data && filtered.length === 0 && <p className="empty-state">No boundary records match these filters.</p>}
      {filtered.map((record) => (
        <article className="record-card management-record" key={record.id}>
          <div>
            <strong>Unit {record.unit_no} · {record.driver_name}</strong>
            <small>{record.date} · {pesos(record.amount)}</small>
          </div>
          <div className="record-actions">
            <span className={"status-label " + (record.paid_at ? "status-paid" : "status-unpaid")}>
              {record.paid_at ? "Paid" : "Unpaid"}
            </span>
            {!record.paid_at && (
              <button className="btn btn-navy" onClick={() => pay(record)} disabled={action.busy}>Record payment</button>
            )}
          </div>
        </article>
      ))}
      {records.data && (
        <div className="payment-totals">
          <p>Total collected {pesos(totals.paid / 100)}</p>
          <p>Total unpaid {pesos(totals.unpaid / 100)}</p>
        </div>
      )}
    </PageLayout>
  );
}
