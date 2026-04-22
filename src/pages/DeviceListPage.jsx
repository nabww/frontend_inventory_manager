import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { deviceApi, refApi, getMsg } from "../api";
import { AppShell } from "../components/layout";
import {
  Pagination,
  StatusBadge,
  SimBadge,
  SkeletonRows,
  Empty,
  Confirm,
  Spinner,
} from "../components/common";
import {
  RiAddLine,
  RiSearchLine,
  RiDownloadLine,
  RiUploadLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiEditLine,
  RiLockLine,
  RiFilterLine,
  RiCloseLine,
} from "react-icons/ri";
import { useAuth } from "../contexts";
import { format } from "date-fns";
import toast from "react-hot-toast";
import DeviceFormModal from "./DeviceFormModal";

export default function DeviceListPage() {
  const { isAdmin, isOfficer } = useAuth();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [countyId, setCountyId] = useState("");
  const [affiliationId, setAffiliationId] = useState("");
  const [hasSim, setHasSim] = useState("");
  const [coverCond, setCoverCond] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [counties, setCounties] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    Promise.all([refApi.counties(), refApi.affiliations()]).then(([c, a]) => {
      setCounties(c.data.data);
      setAffiliations(a.data.data);
    });
  }, []);

  const activeFilterCount = [
    status,
    countyId,
    affiliationId,
    hasSim,
    coverCond,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatus("");
    setCountyId("");
    setAffiliationId("");
    setHasSim("");
    setCoverCond("");
  };

  const fetch = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const r = await deviceApi.list({
          page,
          limit: 20,
          search,
          status,
          countyId,
          affiliationId,
          hasSim,
          coverCondition: coverCond,
        });
        setDevices(r.data.data);
        setPag(r.data.pagination);
      } catch (e) {
        toast.error(getMsg(e, "Failed to load devices"));
      } finally {
        setLoading(false);
      }
    },
    [search, status, countyId, affiliationId, hasSim, coverCond],
  );

  useEffect(() => {
    const t = setTimeout(() => fetch(1), 320);
    return () => clearTimeout(t);
  }, [fetch]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deviceApi.remove(deleteId);
      toast.success("Device deleted");
      setDeleteId(null);
      fetch(pag.page);
    } catch (e) {
      toast.error(getMsg(e, "Delete failed"));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const r = await deviceApi.export({
        search,
        status,
        countyId,
        affiliationId,
        hasSim,
        coverCondition: coverCond,
      });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `devices_${format(new Date(), "yyyyMMdd")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    fileRef.current.value = "";
    try {
      const r = await deviceApi.import(file);
      const { imported, skipped } = r.data.data;
      toast.success(`Imported ${imported}, skipped ${skipped}`);
      fetch(1);
    } catch (e) {
      toast.error(getMsg(e, "Import failed"));
    }
  };

  const onFormSuccess = () => {
    setShowForm(false);
    setEditDevice(null);
    fetch(pag.page);
  };
  const canEdit = (d) => isOfficer && (!d.locked || isAdmin);

  return (
    <AppShell title="Devices">
      <div className="page-hd">
        <div>
          <h1>Device Inventory</h1>
          <p>{pag.total} devices registered</p>
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
                onClick={() => fileRef.current.click()}>
                <RiUploadLine size={14} /> Import
              </button>
            </>
          )}
          <button
            className="btn btn-outline"
            onClick={handleExport}
            disabled={exporting}>
            {exporting ? <Spinner size={13} /> : <RiDownloadLine size={14} />}{" "}
            Export
          </button>
          {isOfficer && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditDevice(null);
                setShowForm(true);
              }}>
              <RiAddLine size={15} /> Add Device
            </button>
          )}
        </div>
      </div>

      <div className="card mb-16">
        <div className="card-body" style={{ padding: "12px 18px" }}>
          {/* Search + filter toggle row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}>
            <div className="search-wrap" style={{ flex: 1 }}>
              <RiSearchLine className="search-ic" />
              <input
                className="input"
                placeholder="Serial, IMEI, model, MFL, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`btn ${showFilters || activeFilterCount > 0 ? "btn-primary" : "btn-outline"}`}
              onClick={() => setShowFilters((p) => !p)}>
              <RiFilterLine size={14} />
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </button>
            {activeFilterCount > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={clearFilters}
                title="Clear filters">
                <RiCloseLine size={14} /> Clear
              </button>
            )}
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))",
                gap: 10,
                marginTop: 12,
              }}>
              <div>
                <div
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                  Status
                </div>
                <select
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="under_repair">Under Repair</option>
                  <option value="repair_return_pending">
                    Repair Return Pending
                  </option>
                  <option value="returned">Returned</option>
                  <option value="pending_transfer">Pending Transfer</option>
                  <option value="decommissioned">Decommissioned</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <div
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                  SIM Card
                </div>
                <select
                  className="input"
                  value={hasSim}
                  onChange={(e) => setHasSim(e.target.value)}>
                  <option value="">All</option>
                  <option value="1">With SIM</option>
                  <option value="0">WiFi Only</option>
                </select>
              </div>
              <div>
                <div
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                  Cover Condition
                </div>
                <select
                  className="input"
                  value={coverCond}
                  onChange={(e) => setCoverCond(e.target.value)}>
                  <option value="">All</option>
                  <option value="good">Good</option>
                  <option value="damaged">Damaged</option>
                  <option value="missing">Missing</option>
                  <option value="replaced">Replaced</option>
                </select>
              </div>
              <div>
                <div
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                  County
                </div>
                <select
                  className="input"
                  value={countyId}
                  onChange={(e) => setCountyId(e.target.value)}>
                  <option value="">All</option>
                  {counties.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div
                  style={{
                    fontSize: ".72rem",
                    fontWeight: 600,
                    color: "var(--text-3)",
                    marginBottom: 4,
                    textTransform: "uppercase",
                  }}>
                  Affiliation
                </div>
                <select
                  className="input"
                  value={affiliationId}
                  onChange={(e) => setAffiliationId(e.target.value)}>
                  <option value="">All</option>
                  {affiliations.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Model</th>
                <th>SIM</th>
                <th>Facility</th>
                <th>County</th>
                <th>Affiliation</th>
                <th>Status</th>
                <th>Last Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={9} rows={8} />
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <Empty
                      title="No devices found"
                      sub={
                        search || activeFilterCount > 0
                          ? "Try adjusting your search or filters"
                          : "Add your first device to get started"
                      }
                      action={
                        isOfficer && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowForm(true)}>
                            <RiAddLine size={13} /> Add Device
                          </button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr
                    key={d.id}
                    style={d.locked ? { background: "#fff9f9" } : {}}>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}>
                        <span className="fw6">{d.serial_number}</span>
                        {!!d.locked && (
                          <span
                            title="Locked — loss report pending"
                            style={{
                              color: "#dc2626",
                              display: "flex",
                              alignItems: "center",
                            }}>
                            <RiLockLine size={12} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{d.model || <span className="td-dim">—</span>}</td>
                    <td>
                      <SimBadge hasSim={!!d.has_sim} />
                    </td>
                    <td>
                      <span>{d.facility_name}</span>
                      <br />
                      <span className="td-dim">{d.mfl_code}</span>
                    </td>
                    <td className="td-dim">{d.county}</td>
                    <td className="td-dim">{d.affiliation}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="td-dim">
                      {d.last_verified_at ? (
                        format(new Date(d.last_verified_at), "dd MMM yyyy")
                      ) : (
                        <span className="badge b-partial">Unverified</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 3 }}>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title="View"
                          onClick={() => navigate(`/devices/${d.id}`)}>
                          <RiEyeLine size={14} />
                        </button>
                        {canEdit(d) && (
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Edit"
                            onClick={() => {
                              setEditDevice(d);
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
                            onClick={() => setDeleteId(d.id)}>
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
              onChange={(p) => fetch(p)}
            />
          </div>
        )}
      </div>

      <Confirm
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        danger
        title="Delete Device"
        message="This will permanently delete the device and all its records. This cannot be undone."
      />

      {showForm && (
        <DeviceFormModal
          device={editDevice}
          onClose={() => {
            setShowForm(false);
            setEditDevice(null);
          }}
          onSuccess={onFormSuccess}
        />
      )}
    </AppShell>
  );
}
