import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { DriverSelect, Field, JeepneySelect } from "../components/FleetOptions";
import { api, todayInManila } from "../api";
import { useAction, useResource } from "../hooks";

const statusLabels = { pending: "Pending", approved: "Approved", declined: "Declined" };
const statusClasses = { pending: "status-unpaid", approved: "status-paid", declined: "status-neutral" };

export default function BorrowRequests() {
  const requests = useResource("requests/");
  const drivers = useResource("drivers/");
  const units = useResource("jeepneys/");
  const action = useAction();
  const [filters, setFilters] = useSearchParams();
  const status = filters.get("status");
  const statusFilter = Object.hasOwn(statusLabels, status) ? status : "";
  const [adding, setAdding] = useState(false);
  const visibleRequests = requests.data?.filter((request) => !statusFilter || request.status === statusFilter);

  function save(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    action.run(async () => {
      await api("requests/", { method: "POST", body });
      if (statusFilter && statusFilter !== "pending") setFilters({ status: "pending" });
      setAdding(false);
      requests.reload();
    }, "Borrow request saved.");
  }

  function decide(request, status) {
    action.run(async () => {
      try {
        await api("requests/" + request.id + "/decision/", { method: "POST", body: { status } });
      } finally {
        requests.reload();
      }
    }, status === "approved" ? "Request approved." : "Request declined.");
  }

  return (
    <PageLayout title="Borrow Requests">
      <div className="toolbar">
        <Field label="Request status">
          <select value={statusFilter} onChange={(event) => setFilters(event.target.value ? { status: event.target.value } : {})}>
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </Field>
        <button className="btn btn-yellow" onClick={() => setAdding(true)}
          disabled={action.busy || !drivers.data?.length || !units.data?.length}>+ New Request</button>
      </div>
      <RecordsFeedback resources={[requests, drivers, units]} action={action} />
      {(drivers.data?.length === 0 || units.data?.length === 0) && (
        <p className="page-note">Register a driver and a jeepney to add a request.</p>
      )}
      {adding && (
        <form className="storyboard-form management-form" onSubmit={save}>
          <h3>New Borrow Request</h3>
          <DriverSelect drivers={drivers.data} />
          <JeepneySelect units={units.data} required />
          <Field label="Requested date"><input name="date" type="date" defaultValue={todayInManila()} required /></Field>
          <Field label="Reason"><textarea name="reason" rows={3} maxLength={500} required /></Field>
          <div className="form-actions">
            <button className="btn btn-navy" disabled={action.busy}>Save request</button>
            <button className="btn btn-gray" type="button" onClick={() => setAdding(false)} disabled={action.busy}>Cancel</button>
          </div>
        </form>
      )}
      {visibleRequests?.length === 0 && (
        <p className="empty-state">{statusFilter ? "No requests match this status." : "No borrow requests yet."}</p>
      )}
      {visibleRequests?.map((request) => (
        <article className="record-card management-record" key={request.id}>
          <div>
            <strong>{request.driver_name}</strong>
            <small>Unit {request.unit_no} · {request.date}</small>
            <small>{request.reason}</small>
          </div>
          <div className="record-actions">
            <span className={"status-label " + statusClasses[request.status]}>{statusLabels[request.status]}</span>
            {request.status === "pending" && (
              <>
                <button className="btn btn-green" disabled={action.busy}
                  onClick={() => decide(request, "approved")}>Approve</button>
                <button className="btn btn-red" disabled={action.busy}
                  onClick={() => decide(request, "declined")}>Decline</button>
              </>
            )}
          </div>
        </article>
      ))}
    </PageLayout>
  );
}
