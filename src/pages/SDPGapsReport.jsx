import { useState, useEffect } from "react";
import { AppShell } from "../components/layout";
import { refApi } from "../api";
import { PageLoader, Empty } from "../components/common";
import { RiDownloadLine } from "react-icons/ri";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function SDPGapsReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCounty, setFilterCounty] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    refApi
      .get("/reports/facility-sdp-gaps")
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((row) => {
    if (filterCounty && row.county !== filterCounty) return false;
    if (filterStatus && row.gap_status !== filterStatus) return false;
    return true;
  });

  const exportExcel = async () => {
    // 1. Log the export (fire-and-forget but we wait to ensure it's recorded)
    try {
      await refApi.post("/audit/report-export", {
        reportName: "sdp_gaps",
        filters: {
          county: filterCounty,
          status: filterStatus,
        },
      });
    } catch (err) {
      console.error("Audit log failed, continuing export", err);
    }

    const ws = XLSX.utils.json_to_sheet(
      filtered.map((row) => ({
        "MFL Code": row.mfl_code,
        Facility: row.facility_name,
        County: row.county,
        "Sub-County": row.sub_county || "",
        SDP: row.sdp_name,
        Devices: row.device_count,
        Providers: row.provider_count,
        "Gap Status":
          row.gap_status === "no_devices"
            ? "❌ No devices"
            : row.gap_status === "no_providers"
              ? "⚠️ No providers"
              : row.gap_status === "ok"
                ? "✅ OK"
                : "Inactive",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SDP Gaps");
    XLSX.writeFile(
      wb,
      `sdp_gaps_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const counties = [...new Set(data.map((r) => r.county))];

  if (loading)
    return (
      <AppShell title="SDP Gaps Report">
        <PageLoader />
      </AppShell>
    );

  return (
    <AppShell title="SDP Assignment Gaps">
      <div className="card">
        <div className="card-head">
          <span className="card-title">Facility SDP Device Gaps</span>
          <button className="btn btn-outline btn-sm" onClick={exportExcel}>
            <RiDownloadLine /> Export Excel
          </button>
        </div>
        <div
          style={{
            padding: "12px 18px",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            borderBottom: "1px solid var(--border)",
          }}>
          <select
            className="input"
            style={{ width: 180 }}
            value={filterCounty}
            onChange={(e) => setFilterCounty(e.target.value)}>
            <option value="">All Counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input"
            style={{ width: 180 }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="no_devices">❌ No Devices (gap)</option>
            <option value="no_providers">⚠️ No Providers</option>
            <option value="ok">✅ OK</option>
          </select>
        </div>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>MFL</th>
                <th>Facility</th>
                <th>County</th>
                <th>SDP</th>
                <th>Devices</th>
                <th>Providers</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <Empty title="No data" />
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => (
                  <tr key={idx}>
                    <td className="td-dim">{row.mfl_code}</td>
                    <td>{row.facility_name}</td>
                    <td>{row.county}</td>
                    <td>{row.sdp_name}</td>
                    <td className="fw6">{row.device_count}</td>
                    <td>{row.provider_count}</td>
                    <td>
                      {row.gap_status === "no_devices" && (
                        <span className="badge b-danger">Missing devices</span>
                      )}
                      {row.gap_status === "no_providers" && (
                        <span className="badge b-warning">No providers</span>
                      )}
                      {row.gap_status === "ok" && (
                        <span className="badge b-active">OK</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
