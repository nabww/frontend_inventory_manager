import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
  RiLockPasswordLine,
} from "react-icons/ri";
import { useAuth } from "../../contexts";
import { useTheme } from "../../contexts";
import { authApi } from "../../api";
import toast from "react-hot-toast";

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.currentPassword || !form.newPassword)
      return toast.error("All fields are required");
    if (form.newPassword.length < 8)
      return toast.error("New password must be at least 8 characters");
    if (form.newPassword !== form.confirm)
      return toast.error("Passwords do not match");
    setSaving(true);
    try {
      await authApi.changePw({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed");
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">Change Password</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div
          className="modal-body"
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="field-group">
            <label className="field-label">Current Password</label>
            <input
              className="input"
              type="password"
              value={form.currentPassword}
              onChange={set("currentPassword")}
              autoFocus
            />
          </div>
          <div className="field-group">
            <label className="field-label">New Password</label>
            <input
              className="input"
              type="password"
              value={form.newPassword}
              onChange={set("newPassword")}
            />
          </div>
          <div className="field-group">
            <label className="field-label">Confirm New Password</label>
            <input
              className="input"
              type="password"
              value={form.confirm}
              onChange={set("confirm")}
            />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving}>
            {saving ? "Saving…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

const NAV = [
  { to: "/dashboard", icon: <RiDashboardLine />, label: "Dashboard" },
  { to: "/devices", icon: <RiTabletLine />, label: "Devices" },
  { to: "/verify", icon: <RiShieldCheckLine />, label: "Verification" },
  { to: "/facilities", icon: <RiHospitalLine />, label: "Facilities" },
];

export const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showPwModal, setShowPwModal] = useState(false);
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
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo size={36} />
          <div>
            <div className="brand-name">EMR Inventory</div>
            <div className="brand-sub">Device Management</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
              onClick={() => setShowPwModal(true)}
              title="Change Password">
              <RiLockPasswordLine size={14} />
            </button>
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={handleLogout}
              title="Logout">
              <RiLogoutBoxLine size={14} />
            </button>
          </div>
        </div>
      </aside>
      {showPwModal && (
        <ChangePasswordModal onClose={() => setShowPwModal(false)} />
      )}
    </>
  );
};

export const Topbar = ({ title }) => {
  const { isDark, toggle } = useTheme();
  return (
    <header className="topbar">
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

export const Logo = ({ size = 40 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <rect width="40" height="40" rx="10" fill="url(#lg)" />
    <rect
      x="7"
      y="10"
      width="26"
      height="18"
      rx="3"
      fill="white"
      fillOpacity="0.15"
    />
    <rect
      x="9"
      y="12"
      width="22"
      height="14"
      rx="2"
      fill="white"
      fillOpacity="0.9"
    />
    <polyline
      points="11,19 14,19 16,15 18,23 20,17 22,21 24,19 29,19"
      stroke="#7c3aed"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M17 31 Q20 34 23 31"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
      fillOpacity="0.7"
    />
    <defs>
      <linearGradient
        id="lg"
        x1="0"
        y1="0"
        x2="40"
        y2="40"
        gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7c3aed" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
    </defs>
  </svg>
);

export const AppShell = ({ title, children }) => (
  <div className="shell">
    <Sidebar />
    <div className="main">
      <Topbar title={title} />
      <main className="page fade">{children}</main>
    </div>
  </div>
);
