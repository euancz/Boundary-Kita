
import { useState } from "react";
import { NavLink, useOutletContext } from "react-router-dom";
import { useAction } from "../hooks";
import Brand from "./Brand";
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

export default function PageLayout({ title, description, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { username, signOut } = useOutletContext();
  const action = useAction();

  return (
    <div className="app-shell">
      {menuOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside id="workspace-navigation" className={`app-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <Brand />
          <button
            className="mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
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
              <Icon size={18} aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link logout-button"
            onClick={() => action.run(signOut)} disabled={action.busy}>
            <LogOut size={19} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            aria-controls="workspace-navigation"
          >
            <Menu size={23} />
          </button>

          <div className="topbar-title">
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>

          <div className="topbar-account" title={`Signed in as ${username}`}>
            <span className="topbar-avatar" aria-hidden="true">{username.slice(0, 2).toUpperCase()}</span>
            <span className="topbar-username">{username}</span>
          </div>
        </header>

        <main className="app-content">
          {action.error && <p className="operation-error" role="alert">{action.error}</p>}
          {children}
        </main>
      </div>
    </div>
  );
}
