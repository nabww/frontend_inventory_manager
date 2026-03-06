import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  RiDashboardLine,
  RiTabletLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiLogoutBoxLine,
  RiMoonLine,
  RiSunLine,
  RiHospitalLine,
  RiFileList3Line,
  RiMenuLine,
  RiCloseLine,
} from "react-icons/ri";
import { useAuth } from "../../contexts";
import { useTheme } from "../../contexts";
import toast from "react-hot-toast";

const NAV = [
  { to: "/dashboard", icon: <RiDashboardLine />, label: "Dashboard" },
  { to: "/devices", icon: <RiTabletLine />, label: "Devices" },
  { to: "/verify", icon: <RiShieldCheckLine />, label: "Verification" },
  { to: "/facilities", icon: <RiHospitalLine />, label: "Facilities" },
];

export const Sidebar = ({ open, onClose }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const initials =
    user?.fullName
      ?.split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "?";

  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
    onClose();
  };
  const handleNav = () => {
    onClose();
  };

  return (
    <>
      {/* Overlay — mobile only */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,10,30,.45)",
            backdropFilter: "blur(2px)",
            zIndex: 99,
            display: "none",
          }}
          className="sidebar-overlay"
        />
      )}

      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">💊</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-name">EMR Inventory</div>
            <div className="brand-sub">Device Management</div>
          </div>
          {/* Close button — mobile only */}
          <button
            className="btn btn-ghost btn-icon btn-sm sidebar-close"
            onClick={onClose}>
            <RiCloseLine size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNav}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }>
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <div className="nav-label">Admin</div>
              <NavLink
                to="/users"
                onClick={handleNav}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }>
                <span className="icon">
                  <RiTeamLine />
                </span>
                Users
              </NavLink>
              <NavLink
                to="/audit-log"
                onClick={handleNav}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }>
                <span className="icon">
                  <RiFileList3Line />
                </span>
                Audit Log
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-foot">
          <div className="user-pill">
            <div className="avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{user?.fullName}</div>
              <div className="user-role">{user?.role?.replace("_", " ")}</div>
            </div>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={handleLogout}
              title="Logout">
              <RiLogoutBoxLine size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export const Topbar = ({ title, onMenuClick }) => {
  const { isDark, toggle } = useTheme();
  return (
    <header className="topbar">
      {/* Hamburger — mobile only */}
      <button
        className="btn btn-ghost btn-icon hamburger"
        onClick={onMenuClick}
        title="Menu">
        <RiMenuLine size={20} />
      </button>
      <span className="topbar-title">{title}</span>
      <div className="topbar-space" />
      <button
        className="btn btn-ghost btn-icon"
        onClick={toggle}
        title="Toggle theme">
        {isDark ? <RiSunLine size={17} /> : <RiMoonLine size={17} />}
      </button>
    </header>
  );
};

export const AppShell = ({ title, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="shell">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main">
        <Topbar title={title} onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="page fade">{children}</main>
      </div>
    </div>
  );
};
