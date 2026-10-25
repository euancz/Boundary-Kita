
import { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BusFront,
  Route,
  Wallet,
  ClipboardList,
  MapPinned,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Driver Profiles", path: "/drivers", icon: Users },
  { label: "Jeepney Units", path: "/jeepneys", icon: BusFront },
  { label: "Jeepney Routes", path: "/jeepney-routes", icon: Route },
  { label: "Boundary Records", path: "/boundaries", icon: Wallet },
  { label: "Borrow Requests", path: "/requests", icon: ClipboardList },
  { label: "Live GPS Map", path: "/tracking", icon: MapPinned },
];

export default function PageLayout({ title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <BusFront size={28} />
          <div>
            <strong>BOUNDARY-KITA</strong>
            <small>Jeepney Management</small>
          </div>
          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <p className="sidebar-section">MAIN MENU</p>

        <nav className="sidebar-nav">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/dashboard"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-link">
            <LogOut size={19} />
            <span>Exit Demo</span>
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={23} />
          </button>

          <div className="topbar-title">
            <h1>{title}</h1>
            <span>Boundary-Kita Management System</span>
          </div>

          <div className="topbar-avatar">OP</div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}
