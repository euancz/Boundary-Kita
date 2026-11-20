import { Link } from "react-router-dom";
import { ArrowRight, BusFront, CalendarDays, ClipboardList, MapPinned, Route, Users, Wallet } from "lucide-react";
import PageLayout from "../components/PageLayout";
import RecordsFeedback from "../components/RecordsFeedback";
import { pesos } from "../api";
import { useResource } from "../hooks";

const stats = [
  { label: "Collected today", field: "boundary_today", icon: Wallet },
  { label: "Jeepneys", field: "jeepneys", icon: BusFront },
  { label: "Registered drivers", field: "drivers", icon: Users },
  { label: "Pending requests", field: "pending", icon: ClipboardList },
];

const shortcuts = [
  { label: "Driver profiles", path: "/drivers", icon: Users },
  { label: "Jeepney units", path: "/jeepneys", icon: BusFront },
  { label: "Jeepney routes", path: "/jeepney-routes", icon: Route },
];

const dashboardDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila", weekday: "long", month: "long", day: "numeric", year: "numeric",
});
const reportDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short",
});

export default function Dashboard() {
  const overview = useResource("dashboard/");
  const tracker = useResource("tracking/latest/");
  const unpaid = overview.data?.unpaid_today;
  const pending = overview.data?.pending;
  const report = tracker.data?.recorded_at ? new Date(tracker.data.recorded_at) : null;

  return (
    <PageLayout title="Fleet overview">
      <section aria-labelledby="overview-heading">
        <div className="section-header">
          <h2 id="overview-heading">Daily summary</h2>
          <p className="dashboard-date"><CalendarDays size={15} aria-hidden="true" />{dashboardDate.format(new Date())}</p>
        </div>
        <RecordsFeedback resources={[overview]} />
        <dl className="overview-grid">
          {stats.map(({ label, field, icon: Icon }) => (
            <div className={field === "boundary_today" ? "overview-card featured-metric" : "overview-card"} key={field}>
              <dt><Icon size={18} strokeWidth={1.7} aria-hidden="true" />{label}</dt>
              <dd>{overview.data ? (
                field === "boundary_today" ? pesos(overview.data[field]) : overview.data[field]
              ) : "—"}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="operations-grid">
        <section className="operations-panel queue-panel" aria-labelledby="work-heading">
          <h2 id="work-heading">Items to review</h2>
          <Link className="queue-row" to="/boundaries?status=unpaid">
            <span className="shortcut-icon"><Wallet size={18} aria-hidden="true" /></span>
            <span className="shortcut-label">
              <strong>Unpaid boundaries</strong>
              <small>{unpaid ? `${unpaid.count} outstanding today` : "View boundary records"}</small>
            </span>
            {unpaid && <span className="queue-amount">{pesos(unpaid.amount)}</span>}
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
          </Link>
          <Link className="queue-row" to="/requests?status=pending">
            <span className="shortcut-icon"><ClipboardList size={18} aria-hidden="true" /></span>
            <span className="shortcut-label">
              <strong>Borrow requests</strong>
              <small>{pending == null ? "View requests" : `${pending} awaiting a decision`}</small>
            </span>
            <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
          </Link>
        </section>

        <section className="operations-panel tracking-panel" aria-labelledby="gps-heading">
          <h2 id="gps-heading"><MapPinned size={17} aria-hidden="true" /> Latest GPS report</h2>
          <RecordsFeedback resources={[tracker]} />
          {report && Number.isFinite(report.getTime()) && (
            <dl className="gps-summary">
              <div><dt>Jeepney</dt><dd>{tracker.data.jeepney}</dd></div>
              <div><dt>Reported speed</dt><dd>{tracker.data.speed} km/h</dd></div>
              <div><dt>Received</dt><dd><time dateTime={tracker.data.recorded_at}>{reportDate.format(report)}</time></dd></div>
            </dl>
          )}
          {tracker.data && !tracker.data.recorded_at && <p className="page-note">No tracker reports yet.</p>}
          <Link className="panel-link" to="/tracking">
            Open GPS map <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </div>

      <section className="dashboard-section" aria-labelledby="operations-heading">
        <div className="section-header"><h2 id="operations-heading">Fleet records</h2></div>
        <div className="shortcut-grid">
          {shortcuts.map(({ label, path, icon: Icon }) => (
            <Link className="shortcut-card" to={path} key={path}>
              <span className="shortcut-icon"><Icon size={20} strokeWidth={1.7} aria-hidden="true" /></span>
              <span className="shortcut-label"><strong>{label}</strong></span>
              <ArrowRight size={16} className="shortcut-arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
