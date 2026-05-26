import { useState, useEffect } from "react";
import { AppShell} from "../components/layout"
import { refApi } from "../api";
import { PageLoader, Empty } from "../components/common";
import { RiDownloadLine } from "react-icons/ri";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export default function ChargerGapsReport() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCounty, setFilterCounty] = useState("");

  useEffect(() => {
    refApi
      .get("/reports/charger-gaps")
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error("Failed to load report"))
      .finally(() => setLoading(false));
  }, []);

  const exportExcel = () => {
    const sheetData = filtered.map((row) => ({
      "MFL Code": row.mfl_code,
      Facility: row.facility_name,
      County: row.county,
      "Sub-County": row.sub_county || "",
      "Type A Chargers (Manual)": row.typeA_chargers_manual,
      "Type A Chargers (Attached)": row.typeA_attached,
      "Type A Total Chargers": row.typeA_chargers_manual + row.typeA_attached,
      "Type A Devices": row.typeA_devices_total,
      "Type A Needed (ceil/3)": Math.ceil(row.typeA_devices_total / 3),
      "Type A Gap":
        row.typeA_chargers_manual + row.typeA_attached >=
        Math.ceil(row.typeA_devices_total / 3)
          ? "OK"
          : "Gap",
      "Type C Chargers (Manual)": row.typeC_chargers_manual,
      "Type C Chargers (Attached)": row.typeC_attached,
      "Type C Total Chargers": row.typeC_chargers_manual + row.typeC_attached,
      "Type C Devices": row.typeC_devices_total,
      "Type C Needed (ceil/3)": Math.ceil(row.typeC_devices_total / 3),
      "Type C Gap":
        row.typeC_chargers_manual + row.typeC_attached >=
        Math.ceil(row.typeC_devices_total / 3)
          ? "OK"
          : "Gap",
    }));
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Charger Gaps");
    XLSX.writeFile(
      wb,
      `charger_gaps_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const counties = [...new Set(data.map((r) => r.county))];
  const filtered = filterCounty
    ? data.filter((r) => r.county === filterCounty)
    : data;

  if (loading)
    return (
      <AppShell title="Charger Gaps Report">
        <PageLoader />
      </AppShell>
    );

  return (
    <AppShell title="Charger Gaps Report">
      <div className="card">
        <div className="card-head">
          <span className="card-title">
            Facility Charger Gaps (Type A / Type C)
          </span>
          <button className="btn btn-outline btn-sm" onClick={exportExcel}>
            <RiDownloadLine /> Export Excel
          </button>
        </div>
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid var(--border)",
          }}>
          <select
            className="input"
            style={{ width: 200 }}
            value={filterCounty}
            onChange={(e) => setFilterCounty(e.target.value)}>
            <option value="">All Counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="tbl-wrap" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th rowSpan="2">MFL</th>
                <th rowSpan="2">Facility</th>
                <th rowSpan="2">County</th>
                <th colSpan="4">Type A</th>
                <th colSpan="4">Type C</th>
              </tr>
              <tr>
                <th>Manual</th>
                <th>Attached</th>
                <th>Total</th>
                <th>Devices</th>
                <th>Manual</th>
                <th>Attached</th>
                <th>Total</th>
                <th>Devices</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <Empty title="No data" />
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const typeATotal =
                    row.typeA_chargers_manual + row.typeA_attached;
                  const typeCTotal =
                    row.typeC_chargers_manual + row.typeC_attached;
                  const typeANeeded = Math.ceil(row.typeA_devices_total / 3);
                  const typeCNeeded = Math.ceil(row.typeC_devices_total / 3);
                  const typeAGap = typeATotal < typeANeeded;
                  const typeCGap = typeCTotal < typeCNeeded;
                  return (
                    <tr key={row.facility_id}>
                      <td>{row.mfl_code}</td>
                      <td>{row.facility_name}</td>
                      <td>{row.county}</td>
                      <td>{row.typeA_chargers_manual}</td>
                      <td>{row.typeA_attached}</td>
                      <td className={typeAGap ? "danger" : ""}>
                        {typeATotal} / {typeANeeded}
                      </td>
                      <td>{row.typeA_devices_total}</td>
                      <td>{row.typeC_chargers_manual}</td>
                      <td>{row.typeC_attached}</td>
                      <td className={typeCGap ? "danger" : ""}>
                        {typeCTotal} / {typeCNeeded}
                      </td>
                      <td>{row.typeC_devices_total}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
