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

const Logo = ({ size = 34 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 40 40"
    fill="none"
    width={size}
    height={size}
    style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient
        id="bg"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#a78bfa" />
      </linearGradient>
      <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="10" fill="url(#bg)" />
    <rect width="40" height="40" rx="10" fill="url(#shine)" />
    <rect
      x="9"
      y="7"
      width="16"
      height="22"
      rx="2.5"
      stroke="white"
      strokeWidth="1.8"
      fill="none"
      opacity="0.95"
    />
    <rect
      x="11.5"
      y="10"
      width="11"
      height="13"
      rx="1"
      fill="white"
      opacity="0.2"
    />
    <polyline
      points="12.5,17 14.5,17 15.5,13.5 16.5,20.5 17.5,15 18.5,17 21,17"
      stroke="white"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="17" cy="26" r="1.2" fill="white" opacity="0.8" />
    <path
      d="M28 12 Q31 9 34 12"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
    <path
      d="M29.5 14.5 Q31 13 32.5 14.5"
      stroke="white"
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
      opacity="0.75"
    />
    <circle cx="31" cy="17" r="1.3" fill="white" opacity="0.95" />
  </svg>
);

export { Logo };

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
          <Logo size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="brand-name">EMR Inventory</div>
            <div className="brand-sub">Device Management</div>
          </div>
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
