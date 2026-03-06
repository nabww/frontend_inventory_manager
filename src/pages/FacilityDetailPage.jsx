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
} from "../components/common";
import {
  RiArrowLeftLine,
  RiTabletLine,
  RiMapPinLine,
  RiBuilding2Line,
} from "react-icons/ri";
import toast from "react-hot-toast";

export default function FacilityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [facility, setFacility] = useState(null);
  const [devices, setDevices] = useState([]);
  const [pag, setPag] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [devLoad, setDevLoad] = useState(true);

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

  if (loading)
    return (
      <AppShell title="Facility">
        <PageLoader />
      </AppShell>
    );

  return (
    <AppShell title={facility?.name || "Facility"}>
      {/* Back */}
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 16 }}
        onClick={() => navigate("/facilities")}>
        <RiArrowLeftLine size={14} /> Back to Facilities
      </button>

      {/* Facility info card */}
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

      {/* Devices table */}
      <div className="card">
        <div className="card-head">
          <span className="card-title">Assigned Devices</span>
          <span className="badge b-purple">{pag.total}</span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Serial Number</th>
                <th>Model</th>
                <th>Asset Tag</th>
                <th>SIM</th>
                <th>Cover</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {devLoad ? (
                <SkeletonRows cols={7} rows={6} />
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
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
    </AppShell>
  );
}
