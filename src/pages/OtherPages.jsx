// ================================================================
// VerifyPage
// ================================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { verifyApi, refApi, userApi, authApi, getMsg } from "../api";
import { AppShell } from "../components/layout";
import {
  Pagination,
  StatusBadge,
  SkeletonRows,
  Empty,
  Modal,
  Field,
  ErrAlert,
  Spinner,
  Confirm,
} from "../components/common";
import {
  RiSearchLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiUploadLine,
} from "react-icons/ri";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "../contexts";

export function VerifyPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState("");

  const fetch = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await verifyApi.list({ page, limit: 20, year });
        setRows(r.data.data);
        setPag(r.data.pagination);
      } catch (e) {
        toast.error(getMsg(e, "Failed to load"));
      } finally {
        setLoading(false);
      }
    },
    [year],
  );

  useEffect(() => {
    fetch(1);
  }, [fetch]);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <AppShell title="Verifications">
      <div className="page-hd">
        <div>
          <h1>Verification Log</h1>
          <p>{pag.total} total verification records</p>
        </div>
      </div>
      <div className="card mb-16">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          <select
            className="input"
            style={{ width: "auto" }}
            value={year}
            onChange={(e) => setYear(e.target.value)}>
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Device</th>
                <th>Facility</th>
                <th>Result</th>
                <th>Present</th>
                <th>SIM</th>
                <th>Cover</th>
                <th>Powers On</th>
                <th>EMR</th>
                <th>Verified By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={10} rows={8} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <Empty title="No verifications found" />
                  </td>
                </tr>
              ) : (
                rows.map((v) => (
                  <tr
                    key={v.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/devices/${v.device_id}`)}>
                    <td>
                      <span className="fw6">{v.serial_number}</span>
                      <br />
                      <span className="td-dim">{v.model}</span>
                    </td>
                    <td className="td-dim">
                      {v.facility} ({v.mfl_code})
                    </td>
                    <td>
                      <StatusBadge status={v.overall_status} />
                    </td>
                    <td>{v.device_present ? "✅" : "❌"}</td>
                    <td>{v.sim_paired ? "✅" : "❌"}</td>
                    <td>{v.cover_ok ? "✅" : "❌"}</td>
                    <td>{v.powers_on ? "✅" : "❌"}</td>
                    <td>{v.emr_working ? "✅" : "❌"}</td>
                    <td className="td-dim">{v.verified_by_name}</td>
                    <td className="td-dim">
                      {format(new Date(v.verified_at), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pag.totalPages > 1 && (
          <div
            style={{
              padding: "12px 18px",
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid var(--border)",
            }}>
            <Pagination
              page={pag.page}
              totalPages={pag.totalPages}
              onChange={(p) => fetch(p)}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ================================================================
// FacilitiesPage — with import, add, edit, delete
// ================================================================
export function FacilitiesPage() {
  const { isOfficer, isAdmin } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [counties, setCounties] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editFac, setEditFac] = useState(null);
  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    refApi.counties().then((r) => setCounties(r.data.data));
  }, []);

  const fetchFacs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await refApi.facilities({ page, limit: 20, search });
        setFacilities(r.data.data);
        setPag(r.data.pagination);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchFacs(1), 320);
    return () => clearTimeout(t);
  }, [fetchFacs]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await refApi.deleteFacility(delId);
      toast.success("Facility deleted");
      setDelId(null);
      fetchFacs(pag.page);
    } catch (e) {
      toast.error(getMsg(e, "Cannot delete facility"));
    } finally {
      setDeleting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current.value = "";
    setImporting(true);
    try {
      const r = await refApi.importFacilities(file);
      const { imported, skipped, errors } = r.data.data;
      toast.success(`Imported ${imported}, skipped ${skipped}`);
      if (errors?.length) toast.error(`${errors.length} rows had errors`);
      fetchFacs(1);
    } catch (e) {
      toast.error(getMsg(e, "Import failed"));
    } finally {
      setImporting(false);
    }
  };

  const onSuccess = () => {
    setShowForm(false);
    setEditFac(null);
    fetchFacs(1);
  };

  return (
    <AppShell title="Facilities">
      <div className="page-hd">
        <div>
          <h1>Facilities</h1>
          <p>{pag.total} registered facilities</p>
        </div>
        <div className="hd-actions">
          {isOfficer && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <button
                className="btn btn-outline"
                onClick={() => fileRef.current.click()}
                disabled={importing}>
                {importing ? <Spinner size={13} /> : <RiUploadLine size={14} />}{" "}
                Import
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditFac(null);
                  setShowForm(true);
                }}>
                <RiAddLine size={15} /> Add Facility
              </button>
            </>
          )}
        </div>
      </div>

      <div
        style={{
          fontSize: ".78rem",
          color: "var(--text-3)",
          marginBottom: 14,
        }}>
        Import columns:{" "}
        <code
          style={{
            background: "var(--accent-bg)",
            padding: "1px 6px",
            borderRadius: 4,
          }}>
          MFL Code
        </code>{" "}
        <code
          style={{
            background: "var(--accent-bg)",
            padding: "1px 6px",
            borderRadius: 4,
          }}>
          Facility Name
        </code>{" "}
        <code
          style={{
            background: "var(--accent-bg)",
            padding: "1px 6px",
            borderRadius: 4,
          }}>
          County
        </code>{" "}
        <code
          style={{
            background: "var(--accent-bg)",
            padding: "1px 6px",
            borderRadius: 4,
          }}>
          Sub County
        </code>
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          <div className="search-wrap">
            <RiSearchLine className="search-ic" />
            <input
              className="input"
              placeholder="Search by name or MFL code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>MFL Code</th>
                <th>Facility Name</th>
                <th>County</th>
                <th>Sub-County</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={5} rows={8} />
              ) : facilities.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <Empty title="No facilities found" />
                  </td>
                </tr>
              ) : (
                facilities.map((f) => (
                  <tr key={f.id}>
                    <td className="fw6">{f.mfl_code}</td>
                    <td>{f.name}</td>
                    <td className="td-dim">{f.county_name}</td>
                    <td className="td-dim">{f.sub_county_name || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 3 }}>
                        {isOfficer && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit"
                            onClick={() => {
                              setEditFac(f);
                              setShowForm(true);
                            }}>
                            <RiEditLine size={14} />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Delete"
                            style={{ color: "var(--danger)" }}
                            onClick={() => setDelId(f.id)}>
                            <RiDeleteBinLine size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pag.totalPages > 1 && (
          <div
            style={{
              padding: "12px 18px",
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid var(--border)",
            }}>
            <Pagination
              page={pag.page}
              totalPages={pag.totalPages}
              onChange={(p) => fetchFacs(p)}
            />
          </div>
        )}
      </div>

      <Confirm
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete Facility"
        message="This will permanently delete the facility. Facilities with assigned devices cannot be deleted — reassign devices first."
      />

      {showForm && (
        <FacilityFormModal
          fac={editFac}
          counties={counties}
          onClose={() => {
            setShowForm(false);
            setEditFac(null);
          }}
          onSuccess={onSuccess}
        />
      )}
    </AppShell>
  );
}

function FacilityFormModal({ fac, counties, onClose, onSuccess }) {
  const [form, setForm] = useState(
    fac
      ? {
          mflCode: fac.mfl_code,
          name: fac.name,
          countyId: fac.county_id,
          subCountyId: fac.sub_county_id || "",
        }
      : { mflCode: "", name: "", countyId: "", subCountyId: "" },
  );
  const [subs, setSubs] = useState([]);
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (form.countyId)
      refApi.subCounties(form.countyId).then((r) => setSubs(r.data.data));
    else setSubs([]);
  }, [form.countyId]);

  const set = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    if (errs[f]) setErrs((er) => ({ ...er, [f]: "" }));
  };

  const submit = async () => {
    const e = {};
    if (!form.mflCode.trim()) e.mflCode = "Required";
    if (!form.name.trim()) e.name = "Required";
    if (!form.countyId) e.countyId = "Required";
    if (Object.keys(e).length) {
      setErrs(e);
      return;
    }
    setSaving(true);
    try {
      if (fac) {
        await refApi.updateFacility(fac.id, form);
        toast.success("Facility updated");
      } else {
        await refApi.createFacility(form);
        toast.success("Facility added");
      }
      onSuccess();
    } catch (err) {
      setApiErr(getMsg(err, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={fac ? "Edit Facility" : "Add Facility"}
      footer={
        <>
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={saving}>
            {saving ? (
              <>
                <Spinner size={13} /> Saving…
              </>
            ) : fac ? (
              "Update"
            ) : (
              "Add Facility"
            )}
          </button>
        </>
      }>
      <ErrAlert message={apiErr} />
      <Field label="MFL Code" required error={errs.mflCode}>
        <input
          className={`input ${errs.mflCode ? "err" : ""}`}
          value={form.mflCode}
          onChange={set("mflCode")}
          placeholder="e.g. 14567"
        />
      </Field>
      <Field label="Facility Name" required error={errs.name}>
        <input
          className={`input ${errs.name ? "err" : ""}`}
          value={form.name}
          onChange={set("name")}
          placeholder="e.g. Homa Bay County Hospital"
        />
      </Field>
      <Field label="County" required error={errs.countyId}>
        <select
          className={`input ${errs.countyId ? "err" : ""}`}
          value={form.countyId}
          onChange={(e) => {
            set("countyId")(e);
            setForm((p) => ({ ...p, subCountyId: "" }));
          }}>
          <option value="">Select county…</option>
          {counties.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sub-County">
        <select
          className="input"
          value={form.subCountyId}
          onChange={set("subCountyId")}
          disabled={!subs.length}>
          <option value="">
            {subs.length ? "Select sub-county…" : "Select county first"}
          </option>
          {subs.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  );
}

// ================================================================
// UsersPage
// ================================================================
export function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [delId, setDelId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await userApi.list({ page, limit: 20, search });
        setUsers(r.data.data);
        setPag(r.data.pagination);
      } catch {
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(1), 320);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleDel = async () => {
    setDeleting(true);
    try {
      await userApi.remove(delId);
      toast.success("User deactivated");
      setDelId(null);
      fetchUsers(pag.page);
    } catch (e) {
      toast.error(getMsg(e, "Failed"));
    } finally {
      setDeleting(false);
    }
  };

  const onSuccess = () => {
    setShowForm(false);
    setEditUser(null);
    fetchUsers(pag.page);
  };

  const roleClass = {
    admin: "b-lost",
    field_officer: "b-purple",
    viewer: "b-decomm",
  };

  return (
    <AppShell title="Users">
      <div className="page-hd">
        <div>
          <h1>Users</h1>
          <p>{pag.total} accounts</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditUser(null);
            setShowForm(true);
          }}>
          <RiAddLine size={15} /> Add User
        </button>
      </div>
      <div className="card mb-16">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          <div className="search-wrap">
            <RiSearchLine className="search-ic" />
            <input
              className="input"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={6} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Empty title="No users found" />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <span className="fw6">{u.full_name}</span>
                      {u.id === me?.id && (
                        <span
                          className="badge b-purple"
                          style={{ marginLeft: 6, fontSize: ".63rem" }}>
                          You
                        </span>
                      )}
                    </td>
                    <td className="td-dim">{u.email}</td>
                    <td>
                      <span
                        className={`badge ${roleClass[u.role] || "b-decomm"}`}>
                        {u.role_label}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${u.is_active ? "b-active" : "b-decomm"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="td-dim">
                      {u.last_login
                        ? format(new Date(u.last_login), "dd MMM yyyy")
                        : "Never"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 3 }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => {
                            setEditUser(u);
                            setShowForm(true);
                          }}>
                          <RiEditLine size={14} />
                        </button>
                        {u.id !== me?.id && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            style={{ color: "var(--danger)" }}
                            onClick={() => setDelId(u.id)}>
                            <RiDeleteBinLine size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pag.totalPages > 1 && (
          <div
            style={{
              padding: "12px 18px",
              display: "flex",
              justifyContent: "flex-end",
              borderTop: "1px solid var(--border)",
            }}>
            <Pagination
              page={pag.page}
              totalPages={pag.totalPages}
              onChange={(p) => fetchUsers(p)}
            />
          </div>
        )}
      </div>

      <Confirm
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={handleDel}
        loading={deleting}
        danger
        title="Deactivate User"
        message="User will no longer be able to log in. You can reactivate them by editing the account."
      />

      {showForm && (
        <UserFormModal
          user={editUser}
          onClose={() => {
            setShowForm(false);
            setEditUser(null);
          }}
          onSuccess={onSuccess}
        />
      )}
    </AppShell>
  );
}

function UserFormModal({ user, onClose, onSuccess }) {
  const isEdit = !!user;
  const ROLES = [
    { id: 1, label: "Viewer" },
    { id: 2, label: "Field Officer" },
    { id: 3, label: "Administrator" },
  ];
  const [form, setForm] = useState(
    isEdit
      ? { roleId: user.role_id, isActive: user.is_active }
      : { fullName: "", email: "", password: "", roleId: 1 },
  );
  const [apiErr, setApiErr] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (f) => (e) =>
    setForm((p) => ({
      ...p,
      [f]:
        f === "roleId"
          ? parseInt(e.target.value)
          : f === "isActive"
            ? e.target.value === "1"
            : e.target.value,
    }));

  const submit = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        await userApi.update(user.id, form);
        toast.success("User updated");
      } else {
        await authApi.register(form);
        toast.success("User created");
      }
      onSuccess();
    } catch (err) {
      setApiErr(getMsg(err, "Failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? `Edit — ${user.full_name}` : "Add User"}
      footer={
        <>
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={saving}>
            {saving ? (
              <>
                <Spinner size={13} /> Saving…
              </>
            ) : isEdit ? (
              "Update"
            ) : (
              "Create User"
            )}
          </button>
        </>
      }>
      <ErrAlert message={apiErr} />
      {!isEdit && (
        <>
          <Field label="Full Name" required>
            <input
              className="input"
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="Jane Doe"
            />
          </Field>
          <Field label="Email" required>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="jane@org.org"
            />
          </Field>
          <Field label="Password" required>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
            />
          </Field>
        </>
      )}
      <Field label="Role">
        <select className="input" value={form.roleId} onChange={set("roleId")}>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </Field>
      {isEdit && (
        <Field label="Account Status">
          <select
            className="input"
            value={form.isActive ? "1" : "0"}
            onChange={set("isActive")}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
        </Field>
      )}
    </Modal>
  );
}
// ================================================================
// AuditLogPage
// ================================================================
export function AuditLogPage() {
  const [rows, setRows] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");

  const fetchLogs = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await refApi.auditLogs({ page, limit: 20, search, action });
        setRows(r.data.data);
        setPag(r.data.pagination);
      } catch (e) {
        toast.error(getMsg(e, "Failed to load audit logs"));
      } finally {
        setLoading(false);
      }
    },
    [search, action],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(1), 320);
    return () => clearTimeout(t);
  }, [fetchLogs]);

  const ACTIONS = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "TRANSFER",
    "VERIFY",
    "IMPORT",
    "EXPORT",
  ];

  const actionClass = {
    CREATE: "b-active",
    UPDATE: "b-sim",
    DELETE: "b-lost",
    LOGIN: "b-purple",
    LOGOUT: "b-decomm",
    TRANSFER: "b-partial",
    VERIFY: "b-pass",
    IMPORT: "b-purple",
    EXPORT: "b-decomm",
  };

  return (
    <AppShell title="Audit Log">
      <div className="page-hd">
        <div>
          <h1>Audit Log</h1>
          <p>{pag.total} recorded actions</p>
        </div>
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          <div className="filter-bar">
            <div className="search-wrap">
              <RiSearchLine className="search-ic" />
              <input
                className="input"
                placeholder="Search by user or entity…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input"
              style={{ width: "auto" }}
              value={action}
              onChange={(e) => setAction(e.target.value)}>
              <option value="">All actions</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={10} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Empty title="No audit records found" />
                  </td>
                </tr>
              ) : (
                rows.map((log) => (
                  <tr key={log.id}>
                    <td className="td-dim" style={{ whiteSpace: "nowrap" }}>
                      {format(new Date(log.created_at), "dd MMM yyyy HH:mm")}
                    </td>
                    <td className="fw6">{log.actor}</td>
                    <td>
                      <span
                        className={`badge ${actionClass[log.action] || "b-decomm"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td
                      className="td-dim"
                      style={{ textTransform: "capitalize" }}>
                      {log.entity_type}
                    </td>
                    <td className="td-dim">{log.entity_id || "—"}</td>
                    <td
                      className="td-dim"
                      style={{
                        fontSize: ".75rem",
                        maxWidth: 220,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                      {log.new_values
                        ? JSON.stringify(log.new_values).slice(0, 80)
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {pag.totalPages > 1 && (
          <div
            style={{
              padding: "12px 18px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--border)",
            }}>
            <span className="dim">
              Showing {(pag.page - 1) * pag.limit + 1}–
              {Math.min(pag.page * pag.limit, pag.total)} of {pag.total}
            </span>
            <Pagination
              page={pag.page}
              totalPages={pag.totalPages}
              onChange={(p) => fetchLogs(p)}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
