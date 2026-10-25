
import { Link } from "react-router-dom";
import {
  BusFront,
  Users,
  ClipboardList,
  Wallet,
  Route,
  MapPinned,
  ArrowUpRight,
} from "lucide-react";
import PageLayout from "../components/PageLayout";

const stats = [
  { label: "Total Jeepneys", value: "12", icon: BusFront },
  { label: "Registered Drivers", value: "14", icon: Users },
  { label: "Pending Requests", value: "3", icon: ClipboardList },
  { label: "Boundary Today", value: "₱9,600", icon: Wallet },
];

const shortcuts = [
  { label: "Driver Profiles", path: "/drivers", icon: Users },
  { label: "Jeepney Units", path: "/jeepneys", icon: BusFront },
  { label: "Jeepney Routes", path: "/jeepney-routes", icon: Route },
  { label: "Boundary Records", path: "/boundaries", icon: Wallet },
  { label: "Borrow Requests", path: "/requests", icon: ClipboardList },
  { label: "Live GPS Map", path: "/tracking", icon: MapPinned },
];

export default function Dashboard() {
  return (
    <PageLayout title="Dashboard">
      <div className="welcome-banner">
        <div>
          <p>OPERATIONS OVERVIEW</p>
          <h2>Welcome to Boundary-Kita</h2>
          <span>
            Manage your jeepneys, drivers, boundaries, and GPS tracking.
          </span>
        </div>
        <BusFront size={64} strokeWidth={1.3} />
      </div>

      <h3 className="section-heading">Overview</h3>

      <div className="overview-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="overview-card" key={label}>
            <div className="overview-icon">
              <Icon size={23} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <h3 className="section-heading">Quick Access</h3>

      <div className="shortcut-grid">
        {shortcuts.map(({ label, path, icon: Icon }) => (
          <Link className="shortcut-card" to={path} key={path}>
            <div className="shortcut-icon">
              <Icon size={24} />
            </div>
            <strong>{label}</strong>
            <ArrowUpRight size={18} className="shortcut-arrow" />
          </Link>
        ))}
      </div>

      <p className="demo-caption">
        Dashboard statistics are sample values until connected to Django.
      </p>
    </PageLayout>
  );
}
