import { useState, useEffect } from "react";
import { AppShell } from "../components/layout";
import { refApi } from "../api";
import { PageLoader } from "../components/common";
import { RiDownloadLine } from "react-icons/ri";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import React from "react";

export default function SDPDeviceMatrix() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refApi
      .get("/reports/facility-sdp-matrix")
      .then((res) => setData(res.data.data))
      .catch((err) => toast.error("Failed to load matrix"))
      .finally(() => setLoading(false));
  }, []);

  const exportExcel = async () => {
    // 1. Log the export
    try {
      await refApi.post("/audit/report-export", {
        reportName: "sdp_matrix",
        filters: {
          // optional: add any filters like county, etc. if you have them on this page
        },
      });
    } catch (err) {
      console.error("Audit log failed, continuing export", err);
    }

    // 2. Generate the Excel file (same as before)
    if (!data) return;
    const { sdps, facilities } = data;
    const sheetData = facilities.map((f) => {
      const row = {
        "MFL Code": f.mfl_code,
        Facility: f.facility_name,
        County: f.county,
        "Sub-County": f.sub_county || "",
      };
      sdps.forEach((sdp) => {
        row[`${sdp.name} (Devices)`] = f.devices[sdp.id];
        row[`${sdp.name} (Providers)`] = f.providers[sdp.id];
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(sheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SDP Device Provider Matrix");
    XLSX.writeFile(
      wb,
      `sdp_matrix_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  if (loading)
    return (
      <AppShell title="SDP Matrix">
        <PageLoader />
      </AppShell>
    );
  if (!data) return null;

  const { sdps, facilities } = data;

  return (
    <AppShell title="SDP Device & Provider Matrix">
      <div className="card">
        <div className="card-head">
          <span className="card-title">
            Devices and Providers per SDP by Facility
          </span>
          <button className="btn btn-outline btn-sm" onClick={exportExcel}>
            <RiDownloadLine /> Export Excel
          </button>
        </div>
        <div className="tbl-wrap" style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th rowSpan="2">MFL</th>
                <th rowSpan="2">Facility</th>
                <th rowSpan="2">County</th>
                <th rowSpan="2">Sub-County</th>
                {sdps.map((sdp) => (
                  <th key={sdp.id} colSpan="2">
                    {sdp.name}
                  </th>
                ))}
              </tr>
              <tr>
                {sdps.map((sdp) => (
                  <React.Fragment key={sdp.id}>
                    <th>Devices</th>
                    <th>Providers</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {facilities.map((f) => (
                <tr key={f.facility_id}>
                  <td className="td-dim">{f.mfl_code}</td>
                  <td>{f.facility_name}</td>
                  <td>{f.county}</td>
                  <td>{f.sub_county || "—"}</td>
                  {sdps.map((sdp) => (
                    <React.Fragment key={sdp.id}>
                      <td className="fw6">{f.devices[sdp.id]}</td>
                      <td>{f.providers[sdp.id]}</td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
