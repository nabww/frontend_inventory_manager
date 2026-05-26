import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { refApi, deviceApi, getMsg } from "../api";
import { AppShell } from "../components/layout";
import {
  StatusBadge,
  SimBadge,
  PageLoader,
  Empty,
  SkeletonRows,
  Pagination,
  Field,
} from "../components/common";
import {
  RiArrowLeftLine,
  RiTabletLine,
  RiBuilding2Line,
  RiEditLine,
  RiMapPinLine,
} from "react-icons/ri";
import toast from "react-hot-toast";
import FacilityFormModal from "./FacilityFormModal";
import { chargerApi } from "../api";
import { RiFlashlightLine } from "react-icons/ri";
import { useAuth } from "../contexts";

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sdpStats, setSdpStats] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [devLoad, setDevLoad] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [chargers, setChargers] = useState([]);
  const [chargerTypes, setChargerTypes] = useState([]);
  const [editingCharger, setEditingCharger] = useState(false);
  const [chargerCounts, setChargerCounts] = useState({});
  const [updatingCharger, setUpdatingCharger] = useState(false);

  const { user, isAdmin } = useAuth();

  const [allDevices, setAllDevices] = useState([]);
  const [attachedLoading, setAttachedLoading] = useState(true);
  const [attachedCounts, setAttachedCounts] = useState({ typeA: 0, typeC: 0 });

  useEffect(() => {
    if (id) {
      setAttachedLoading(true);
      deviceApi
        .list({ facilityId: id, limit: 1000, page: 1 })
        .then((res) => {
          const devices = res.data.data || [];
          setAllDevices(devices);
          // Compute attached counts
          let typeA = 0,
            typeC = 0;
          devices.forEach((dev) => {
            if (dev.has_charger) {
              const prefix = (dev.serial_number || "")
                .substring(0, 4)
                .toUpperCase();
              const isTypeC = ["R8Y", "R9PT", "BY9", "HA2"].some((p) =>
                prefix.startsWith(p),
              );
              if (isTypeC) typeC++;
              else typeA++;
            }
          });
          setAttachedCounts({ typeA, typeC });
        })
        .catch((err) =>
          console.error("Failed to load all devices for charger count", err),
        )
        .finally(() => setAttachedLoading(false));
    }
  }, [id]);

  useEffect(() => {
    refApi
      .facility(id)
      .then((r) => setFacility(r.data.data))
      .catch(() => {
        toast.error("Facility not found");
        navigate("/facilities");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (id) {
      refApi
        .get(`/facilities/${id}/sdp-stats`)
        .then((res) => setSdpStats(res.data.data))
        .catch((err) => console.error(err))
        .finally(() => setStatsLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      Promise.all([chargerApi.types(), chargerApi.get(id)])
        .then(([typesRes, chargersRes]) => {
          setChargerTypes(typesRes.data.data);
          const data = chargersRes.data.data;
          setChargers(data);
          const initial = {};
          data.forEach((c) => {
            initial[c.charger_type_id] = c.count;
          });
          setChargerCounts(initial);
        })
        .catch((err) => console.error(err));
    }
  }, [id]);

  const manualTotal = chargers.reduce((sum, c) => sum + c.count, 0);
  const attachedTotal = attachedCounts.typeA + attachedCounts.typeC;
  const totalChargers = manualTotal + attachedTotal;
  const activeDevices = pag.total;
  const neededChargers = Math.ceil(activeDevices / 3);
  const isInsufficient = totalChargers < neededChargers;

  const fetchDevices = async (page = 1) => {
    setDevLoad(true);
    try {
      const r = await deviceApi.list({ facilityId: id, page, limit: 20 });
      setDevices(r.data.data);
      setPag(r.data.pagination);
    } catch (e) {
      toast.error(getMsg(e, "Failed to load devices"));
    } finally {
      setDevLoad(false);
    }
  };

  useEffect(() => {
    fetchDevices(1);
  }, [id]);

  const handleEditSuccess = () => {
    setShowEditModal(false);
    // Refresh facility details and SDP stats
    refApi.facility(id).then((r) => setFacility(r.data.data));
    refApi
      .get(`/facilities/${id}/sdp-stats`)
      .then((res) => setSdpStats(res.data.data));
    toast.success("Facility updated");
  };

  if (loading)
    return (
      <AppShell title="Facility">
        <PageLoader />
      </AppShell>
    );

  return (
    <AppShell title={facility?.name || "Facility"}>
      {/* Back button + Edit button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate("/facilities")}>
          <RiArrowLeftLine size={14} /> Back to Facilities
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShowEditModal(true)}>
          <RiEditLine size={14} /> Edit Facility
        </button>
      </div>

      {/* Facility info card (your original design) */}
      <div className="card mb-22">
        <div
          className="card-body"
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            alignItems: "flex-start",
          }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              flexShrink: 0,
              background: "var(--accent-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--accent)",
              fontSize: 22,
            }}>
            <RiBuilding2Line />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontSize: "1.25rem", marginBottom: 4 }}>
              {facility.name}
            </h1>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: ".82rem",
                  color: "var(--text-2)",
                }}>
                <RiMapPinLine size={13} /> {facility.county_name}
                {facility.sub_county_name
                  ? ` · ${facility.sub_county_name}`
                  : ""}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: ".82rem",
                  color: "var(--text-2)",
                }}>
                <RiTabletLine size={13} /> {pag.total} device
                {pag.total !== 1 ? "s" : ""} assigned
              </span>
            </div>
          </div>
          <div
            style={{
              background: "var(--accent-bg)",
              borderRadius: 8,
              padding: "8px 16px",
              textAlign: "center",
              flexShrink: 0,
            }}>
            <div
              style={{
                fontSize: ".68rem",
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: ".06em",
              }}>
              MFL Code
            </div>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: 700,
                fontFamily: "Syne,sans-serif",
                color: "var(--accent)",
              }}>
              {facility.mfl_code}
            </div>
          </div>
        </div>
      </div>

      {/* Charger Management Card */}
      <div className="card mb-22">
        <div className="card-head">
          <span className="card-title">
            <RiFlashlightLine /> Charger Inventory
          </span>
          {!editingCharger &&
            (isAdmin ||
              (user?.zone_type === "facility" &&
                user?.zone_facility_id === facility?.id)) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEditingCharger(true)}>
                Edit
              </button>
            )}
        </div>
        <div className="card-body">
          {isInsufficient && (
            <div
              className="alert alert-warning"
              style={{
                marginBottom: 16,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#991b1b",
              }}>
              ⚠️ Charger shortage: {totalChargers} chargers available (manual +
              attached to devices), but {neededChargers} needed for{" "}
              {activeDevices} devices (1 per 3 devices).
            </div>
          )}
          {editingCharger ? (
            <div>
              <div className="grid g2">
                {chargerTypes.map((type) => (
                  <Field key={type.id} label={type.name}>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={chargerCounts[type.id] || 0}
                      onChange={(e) =>
                        setChargerCounts((prev) => ({
                          ...prev,
                          [type.id]: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </Field>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "flex-end",
                  marginTop: 16,
                }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setEditingCharger(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  disabled={updatingCharger}
                  onClick={async () => {
                    setUpdatingCharger(true);
                    try {
                      await chargerApi.update(id, chargerCounts);
                      toast.success("Charger counts updated");
                      const updated = await chargerApi.get(id);
                      setChargers(updated.data.data);
                      setEditingCharger(false);
                    } catch (err) {
                      toast.error(getMsg(err, "Failed to update"));
                    } finally {
                      setUpdatingCharger(false);
                    }
                  }}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="grid g2">
              {chargers.map((c) => {
                const attached =
                  c.charger_type === "Type A"
                    ? attachedCounts.typeA
                    : attachedCounts.typeC;
                const total = c.count + attached;
                return (
                  <div key={c.charger_type_id}>
                    <div
                      style={{
                        fontSize: ".7rem",
                        fontWeight: 700,
                        color: "var(--text-3)",
                      }}>
                      {c.charger_type}
                    </div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                      {total}
                    </div>
                    <div className="td-dim" style={{ fontSize: ".7rem" }}>
                      (manual: {c.count}, attached to devices: {attached})
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ADDED: SDP Stats Section */}
      <div className="card mb-22">
        <div className="card-head">
          <span className="card-title">Service Delivery Points</span>
        </div>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Service Delivery Point</th>
                <th>Devices Assigned</th>
                <th>Providers</th>
              </tr>
            </thead>
            <tbody>
              {statsLoading ? (
                <SkeletonRows cols={3} rows={3} />
              ) : sdpStats.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <Empty
                      title="No SDP data"
                      sub="Configure SDPs in facility settings"
                    />
                  </td>
                </tr>
              ) : (
                sdpStats.map((stat) => (
                  <tr key={stat.id}>
                    <td>{stat.name}</td>
                    <td>{stat.device_count}</td>
                    <td>{stat.provider_count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Devices table (your original) */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Assigned Devices</span>
          <span className="badge b-purple">{pag.total}</span>
        </div>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Model</th>
                <th>Asset Tag</th>
                <th>SIM</th>
                <th>Charger</th>
                <th>Cover</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {devLoad ? (
                <SkeletonRows cols={8} rows={6} />
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <Empty
                      title="No devices assigned"
                      sub="Devices transferred or imported to this facility will appear here"
                    />
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr
                    key={d.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/devices/${d.id}`)}>
                    <td className="fw6">{d.serial_number}</td>
                    <td className="td-dim">{d.model || "—"}</td>
                    <td className="td-dim">{d.asset_tag || "—"}</td>
                    <td>
                      <SimBadge hasSim={d.has_sim} />
                    </td>
                    <td className="fw6">
                      {d.has_charger ? "✅ Yes" : "❌ No"}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          d.cover_condition === "good"
                            ? "b-active"
                            : d.cover_condition === "damaged"
                              ? "b-partial"
                              : d.cover_condition === "missing"
                                ? "b-lost"
                                : "b-decomm"
                        }`}>
                        {d.cover_condition}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="td-dim">{d.assigned_to || "—"}</td>
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
              onChange={(p) => fetchDevices(p)}
            />
          </div>
        )}
      </div>

      {showEditModal && (
        <FacilityFormModal
          facility={facility}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </AppShell>
  );
}
