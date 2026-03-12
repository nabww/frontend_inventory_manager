// ================================================================
// VerifyPage
// ================================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  verifyApi,
  refApi,
  userApi,
  authApi,
  deviceApi,
  simApi,
  getMsg,
} from "../api";
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
  RiSimCard2Line,
  RiLinkM,
  RiLinkUnlinkM,
  RiDownloadLine,
} from "react-icons/ri";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "../contexts";

export function VerifyPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);

  const initUnverified = searchParams.get("unverified") === "1";
  const [rows, setRows] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState("");
  const [unverifiedOnly, setUnverifiedOnly] = useState(initUnverified);

  const fetchRows = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        if (unverifiedOnly) {
          const r = await deviceApi.unverified({ page, limit: 20 });
          setRows(r.data.data);
          setPag(r.data.pagination);
        } else {
          const r = await verifyApi.list({ page, limit: 20, year });
          setRows(r.data.data);
          setPag(r.data.pagination);
        }
      } catch (e) {
        toast.error(getMsg(e, "Failed to load"));
      } finally {
        setLoading(false);
      }
    },
    [year, unverifiedOnly],
  );

  useEffect(() => {
    fetchRows(1);
  }, [fetchRows]);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  return (
    <AppShell title="Verifications">
      <div className="page-hd">
        <div>
          <h1>Verification Log</h1>
          <p>
            {pag.total}{" "}
            {unverifiedOnly
              ? "unverified active devices"
              : "total verification records"}
          </p>
        </div>
      </div>
      <div className="card mb-16">
        <div
          className="card-body"
          style={{
            padding: "12px 18px",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
          }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: ".9rem",
            }}>
            <input
              type="checkbox"
              checked={unverifiedOnly}
              onChange={(e) => setUnverifiedOnly(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
            />
            Show unverified only
          </label>
          {!unverifiedOnly && (
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
          )}
        </div>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              {unverifiedOnly ? (
                <tr>
                  <th>Serial</th>
                  <th>Model</th>
                  <th>Facility</th>
                  <th>Location</th>
                  <th>Action</th>
                </tr>
              ) : (
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
              )}
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={unverifiedOnly ? 5 : 10} rows={8} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={unverifiedOnly ? 5 : 10}>
                    <Empty
                      title={
                        unverifiedOnly
                          ? "All active devices verified! 🎉"
                          : "No verifications found"
                      }
                    />
                  </td>
                </tr>
              ) : unverifiedOnly ? (
                rows.map((d) => (
                  <tr
                    key={d.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/devices/${d.id}`)}>
                    <td className="fw6">{d.serial_number}</td>
                    <td className="td-dim">{d.model || "—"}</td>
                    <td className="td-dim">
                      {d.facility}{" "}
                      <span style={{ opacity: 0.6 }}>({d.mfl_code})</span>
                    </td>
                    <td className="td-dim">
                      {d.sub_county}, {d.county}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${d.id}`);
                        }}>
                        Verify
                      </button>
                    </td>
                  </tr>
                ))
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
              onChange={(p) => fetchRows(p)}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ================================================================
// ================================================================
// FacilitiesPage — with import, add, edit, delete
// ================================================================
export function FacilitiesPage() {
  const { isOfficer, isAdmin } = useAuth();
  const navigate = useNavigate();
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
                  <tr
                    key={f.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/facilities/${f.id}`)}>
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
                <th>Zone</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={6} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty title="No users found" />
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const zoneLabel =
                    u.zone_type === "all" ? (
                      <span className="td-dim">All</span>
                    ) : u.zone_type === "county" ? (
                      <span className="badge b-purple">
                        {u.zone_county_name}
                      </span>
                    ) : u.zone_type === "sub_county" ? (
                      <span className="badge b-partial">
                        {u.zone_sub_county_name}
                      </span>
                    ) : u.zone_type === "facility" ? (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                        {(u.zone_facilities || []).length === 0 ? (
                          <span className="td-dim">No facilities</span>
                        ) : (
                          (u.zone_facilities || []).slice(0, 2).map((f) => (
                            <span
                              key={f.id}
                              className="badge b-active"
                              style={{ fontSize: ".65rem" }}>
                              {f.name}
                            </span>
                          ))
                        )}
                        {(u.zone_facilities || []).length > 2 && (
                          <span
                            className="badge b-purple"
                            style={{ fontSize: ".65rem" }}>
                            +{u.zone_facilities.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="td-dim">—</span>
                    );
                  return (
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
                      <td>{zoneLabel}</td>
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
                  );
                })
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
  const ZONE_TYPES = [
    { value: "all", label: "All (no restriction)" },
    { value: "county", label: "County" },
    { value: "sub_county", label: "Sub-County" },
    { value: "facility", label: "Specific Facility" },
  ];

  const [form, setForm] = useState(
    isEdit
      ? {
          roleId: user.role_id,
          isActive: user.is_active,
          zoneType: user.zone_type || "all",
          zoneCountyId: user.zone_county_id || "",
          zoneSubCountyId: user.zone_sub_county_id || "",
          facilityIds: (user.zone_facilities || []).map((f) => f.id),
        }
      : {
          fullName: "",
          email: "",
          password: "",
          roleId: 1,
          zoneType: "all",
          zoneCountyId: "",
          zoneSubCountyId: "",
          facilityIds: [],
        },
  );
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [apiErr, setApiErr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refApi
      .counties()
      .then((r) => setCounties(r.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (form.zoneCountyId) {
      refApi
        .subCounties(form.zoneCountyId)
        .then((r) => setSubCounties(r.data.data || []))
        .catch(() => {});
    } else {
      setSubCounties([]);
    }
  }, [form.zoneCountyId]);

  useEffect(() => {
    if (form.zoneType === "facility") {
      const params = form.zoneCountyId
        ? { countyId: form.zoneCountyId, limit: 200 }
        : { limit: 200 };
      refApi
        .facilities(params)
        .then((r) => setFacilities(r.data.data || []))
        .catch(() => {});
    }
  }, [form.zoneType, form.zoneCountyId]);

  const set = (f) => (e) =>
    setForm((p) => {
      const val =
        f === "roleId"
          ? parseInt(e.target.value)
          : f === "isActive"
            ? e.target.value === "1"
            : e.target.value;
      const next = { ...p, [f]: val };
      // Reset downstream when zone type changes
      if (f === "zoneType") {
        next.zoneCountyId = "";
        next.zoneSubCountyId = "";
        next.facilityIds = [];
      }
      if (f === "zoneCountyId") {
        next.zoneSubCountyId = "";
        next.facilityIds = [];
      }
      return next;
    });

  const toggleFacility = (id) =>
    setForm((p) => {
      const ids = p.facilityIds.includes(id)
        ? p.facilityIds.filter((x) => x !== id)
        : [...p.facilityIds, id];
      return { ...p, facilityIds: ids };
    });

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        zoneCountyId:
          form.zoneType !== "all" && form.zoneCountyId
            ? parseInt(form.zoneCountyId)
            : null,
        zoneSubCountyId:
          form.zoneType === "sub_county" && form.zoneSubCountyId
            ? parseInt(form.zoneSubCountyId)
            : null,
        facilityIds: form.zoneType === "facility" ? form.facilityIds : [],
      };
      if (isEdit) {
        await userApi.update(user.id, payload);
        toast.success("User updated");
      } else {
        await authApi.register(payload);
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

      {/* Zone / scope */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          paddingTop: 14,
          marginTop: 4,
        }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: ".8rem",
            color: "var(--text-3)",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: ".05em",
          }}>
          Data Zone (Scope)
        </div>
        <Field label="Zone Level">
          <select
            className="input"
            value={form.zoneType}
            onChange={set("zoneType")}>
            {ZONE_TYPES.map((z) => (
              <option key={z.value} value={z.value}>
                {z.label}
              </option>
            ))}
          </select>
        </Field>
        {(form.zoneType === "county" ||
          form.zoneType === "sub_county" ||
          form.zoneType === "facility") && (
          <Field label="County">
            <select
              className="input"
              value={form.zoneCountyId}
              onChange={set("zoneCountyId")}>
              <option value="">— Select county —</option>
              {counties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {form.zoneType === "sub_county" && form.zoneCountyId && (
          <Field label="Sub-County">
            <select
              className="input"
              value={form.zoneSubCountyId}
              onChange={set("zoneSubCountyId")}>
              <option value="">— Select sub-county —</option>
              {subCounties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        {form.zoneType === "facility" && (
          <Field label="Facilities">
            {facilities.length === 0 ? (
              <div className="td-dim" style={{ fontSize: ".85rem" }}>
                {form.zoneCountyId
                  ? "Loading facilities…"
                  : "Select a county first to filter facilities"}
              </div>
            ) : (
              <div
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                }}>
                {facilities.map((f) => (
                  <label
                    key={f.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                      background: form.facilityIds.includes(f.id)
                        ? "var(--accent-bg)"
                        : "transparent",
                    }}>
                    <input
                      type="checkbox"
                      checked={form.facilityIds.includes(f.id)}
                      onChange={() => toggleFacility(f.id)}
                      style={{
                        accentColor: "var(--primary)",
                        width: 15,
                        height: 15,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: ".875rem" }}>
                      {f.name}
                    </span>
                    <span className="td-dim" style={{ fontSize: ".75rem" }}>
                      {f.mfl_code}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {form.facilityIds.length > 0 && (
              <div
                style={{
                  fontSize: ".78rem",
                  color: "var(--primary)",
                  marginTop: 6,
                  fontWeight: 600,
                }}>
                {form.facilityIds.length} facilit
                {form.facilityIds.length === 1 ? "y" : "ies"} selected
              </div>
            )}
          </Field>
        )}
      </div>
    </Modal>
  );
}

// ================================================================
// SimsPage
// ================================================================
export function SimsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editSim, setEditSim] = useState(null);
  const [linkSim, setLinkSim] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchSims = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await simApi.list({ page, limit: 20, search });
        setRows(r.data.data);
        setPag(r.data.pagination);
      } catch (e) {
        toast.error(getMsg(e, "Failed to load"));
      } finally {
        setLoading(false);
      }
    },
    [search],
  );

  useEffect(() => {
    const t = setTimeout(() => fetchSims(1), 320);
    return () => clearTimeout(t);
  }, [fetchSims]);

  const handleUnlink = async (simId) => {
    try {
      await simApi.unlink(simId);
      toast.success("SIM unlinked");
      fetchSims(pag.page);
    } catch (e) {
      toast.error(getMsg(e, "Failed"));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await simApi.export();
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "sim_cards.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell title="SIM Cards">
      <div className="page-hd">
        <div>
          <h1>SIM Cards</h1>
          <p>{pag.total} unique SIM cards</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-outline"
            onClick={handleExport}
            disabled={exporting}>
            <RiDownloadLine size={15} /> {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>
      <div className="card mb-16">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          <div className="search-wrap">
            <RiSearchLine className="search-ic" />
            <input
              className="input"
              placeholder="Search by SIM serial, phone, or network…"
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
                <th>Phone Number</th>
                <th>SIM Serial</th>
                <th>Network</th>
                <th>Linked Device</th>
                <th>Facility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={8} />
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <Empty title="No SIM cards found" />
                  </td>
                </tr>
              ) : (
                rows.map((s) => (
                  <tr key={s.id}>
                    <td className="fw6">
                      {s.phone_number || <span className="td-dim">—</span>}
                    </td>
                    <td className="td-dim" style={{ fontSize: ".8rem" }}>
                      {s.sim_serial || "—"}
                    </td>
                    <td>{s.network || <span className="td-dim">—</span>}</td>
                    <td>
                      {s.device_serial ? (
                        <span
                          className="link"
                          style={{
                            cursor: "pointer",
                            color: "var(--primary)",
                            fontWeight: 600,
                          }}
                          onClick={() => navigate(`/devices/${s.device_id}`)}>
                          {s.device_serial}
                        </span>
                      ) : (
                        <span className="badge b-decomm">Unlinked</span>
                      )}
                    </td>
                    <td className="td-dim">
                      {s.facility_name
                        ? `${s.facility_name} (${s.mfl_code})`
                        : "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Edit"
                          onClick={() => setEditSim(s)}>
                          <RiEditLine size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Link to device"
                          onClick={() => setLinkSim(s)}>
                          <RiLinkM size={14} />
                        </button>
                        {s.device_id && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Unlink from device"
                            style={{ color: "var(--danger)" }}
                            onClick={() => handleUnlink(s.id)}>
                            <RiLinkUnlinkM size={14} />
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
              onChange={(p) => fetchSims(p)}
            />
          </div>
        )}
      </div>

      {editSim && (
        <SimEditModal
          sim={editSim}
          onClose={() => setEditSim(null)}
          onSuccess={() => {
            setEditSim(null);
            fetchSims(pag.page);
          }}
        />
      )}
      {linkSim && (
        <SimLinkModal
          sim={linkSim}
          onClose={() => setLinkSim(null)}
          onSuccess={() => {
            setLinkSim(null);
            fetchSims(pag.page);
          }}
        />
      )}
    </AppShell>
  );
}

function SimEditModal({ sim, onClose, onSuccess }) {
  const [form, setForm] = useState({
    simSerial: sim.sim_serial || "",
    phoneNumber: sim.phone_number || "",
    network: sim.network || "",
    pin: "",
    puk: "",
  });
  const [saving, setSaving] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const submit = async () => {
    setSaving(true);
    try {
      await simApi.update(sim.id, form);
      toast.success("SIM updated");
      onSuccess();
    } catch (e) {
      setApiErr(getMsg(e, "Failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit SIM — ${sim.phone_number || sim.sim_serial}`}
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
            ) : (
              "Update"
            )}
          </button>
        </>
      }>
      <ErrAlert message={apiErr} />
      <Field label="Phone Number">
        <input
          className="input"
          value={form.phoneNumber}
          onChange={set("phoneNumber")}
        />
      </Field>
      <Field label="SIM Serial">
        <input
          className="input"
          value={form.simSerial}
          onChange={set("simSerial")}
        />
      </Field>
      <Field label="Network">
        <input
          className="input"
          value={form.network}
          onChange={set("network")}
          placeholder="Safaricom / Airtel / Telkom"
        />
      </Field>
      <Field label="PIN (leave blank to keep current)">
        <input
          className="input"
          type="password"
          value={form.pin}
          onChange={set("pin")}
        />
      </Field>
      <Field label="PUK (leave blank to keep current)">
        <input
          className="input"
          type="password"
          value={form.puk}
          onChange={set("puk")}
        />
      </Field>
    </Modal>
  );
}

function SimLinkModal({ sim, onClose, onSuccess }) {
  const [deviceSerial, setDeviceSerial] = useState("");
  const [devices, setDevices] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [apiErr, setApiErr] = useState("");

  const doSearch = async () => {
    if (!deviceSerial.trim()) return;
    setSearching(true);
    try {
      const r = await deviceApi.list({ search: deviceSerial, limit: 10 });
      setDevices(r.data.data || []);
    } catch {
    } finally {
      setSearching(false);
    }
  };

  const submit = async () => {
    if (!selected) return toast.error("Select a device first");
    setSaving(true);
    try {
      await simApi.link(sim.id, selected);
      toast.success("SIM linked");
      onSuccess();
    } catch (e) {
      setApiErr(getMsg(e, "Failed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Link SIM — ${sim.phone_number || sim.sim_serial}`}
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
            disabled={saving || !selected}>
            {saving ? (
              <>
                <Spinner size={13} /> Linking…
              </>
            ) : (
              "Link to Device"
            )}
          </button>
        </>
      }>
      <ErrAlert message={apiErr} />
      <Field label="Search device by serial">
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            value={deviceSerial}
            onChange={(e) => setDeviceSerial(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Serial number…"
          />
          <button
            className="btn btn-outline"
            onClick={doSearch}
            disabled={searching}>
            {searching ? <Spinner size={13} /> : <RiSearchLine size={14} />}
          </button>
        </div>
      </Field>
      {devices.length > 0 && (
        <div
          style={{
            marginTop: 8,
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}>
          {devices.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelected(d.id)}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                background:
                  selected === d.id
                    ? "var(--bg-active,#ede9fe)"
                    : "transparent",
                borderBottom: "1px solid var(--border)",
              }}>
              <span className="fw6">{d.serial_number}</span>
              <span className="td-dim">
                {d.facility_name} — {d.model}
              </span>
            </div>
          ))}
        </div>
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
