import { useState } from "react";
import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { api } from "../api";
import { useAction, useResource } from "../hooks";

export default function DriverProfiles() {
  const [search, setSearch] = useState("");
  const drivers = useResource("drivers/");
  const action = useAction();
  const query = search.trim().toLowerCase();
  const filtered = (drivers.data || []).filter((driver) =>
    [driver.name, driver.license, driver.unit_no].some((value) => value?.toLowerCase().includes(query))
  );

  function archive(driver) {
    if (!window.confirm("Archive " + driver.name + "? Existing records will be kept.")) return;
    action.run(async () => {
      await api("drivers/" + driver.id + "/", { method: "DELETE" });
      drivers.reload();
    }, "Driver archived.");
  }

  return (
    <PageLayout title="Driver Profiles">
      <div className="toolbar">
        <input type="search" placeholder="Search drivers" aria-label="Search drivers"
          value={search} onChange={(event) => setSearch(event.target.value)} />
        <Link to="/drivers/add" className="btn btn-yellow">+ Add Driver</Link>
      </div>
      <RecordsFeedback resources={[drivers]} action={action} />
      {drivers.data && filtered.length === 0 && <p className="empty-state">{query ? "No matching drivers." : "No drivers registered."}</p>}
      {filtered.map((driver) => (
        <article className="record-card management-record" key={driver.id}>
          <div className="avatar">
            {driver.photo_url ? <img src={driver.photo_url} alt="" /> : <UserRound aria-hidden="true" />}
          </div>
          <div>
            <strong>{driver.name}</strong>
            <small>License {driver.license} · Expires {driver.license_expiry}</small>
            <small>{driver.unit_no ? "Unit " + driver.unit_no : "Unassigned"} · {driver.contact}</small>
            <small>{driver.address}</small>
          </div>
          <div className="record-actions">
            <Link className="btn btn-gray" to={"/drivers/" + driver.id + "/edit"}>Edit</Link>
            <button className="btn btn-red" disabled={action.busy} onClick={() => archive(driver)}>Archive</button>
          </div>
        </article>
      ))}
    </PageLayout>
  );
}
