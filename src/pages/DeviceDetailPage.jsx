import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { deviceApi, refApi, getMsg } from "../api";
import { AppShell } from "../components/layout";
import {
  PageLoader,
  StatusBadge,
  SimBadge,
  Modal,
  Field,
  ErrAlert,
  Spinner,
  Empty,
} from "../components/common";
import {
  RiArrowLeftLine,
  RiEditLine,
  RiShieldCheckLine,
  RiExchangeLine,
  RiLockLine,
} from "react-icons/ri";
import { useAuth } from "../contexts";
import { format } from "date-fns";
import toast from "react-hot-toast";
import DeviceFormModal from "./DeviceFormModal";

const F = ({ label, value }) => (
  <div style={{ marginBottom: 14 }}>
    <div
      style={{
        fontSize: ".7rem",
        fontWeight: 700,
        color: "var(--text-3)",
        textTransform: "uppercase",
        letterSpacing: ".07em",
        marginBottom: 3,
      }}>
      {label}
    </div>
    <div
      style={{
        fontSize: ".88rem",
        color: value ? "var(--text)" : "var(--text-3)",
      }}>
      {value || "—"}
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="card mb-16">
    <div className="card-head">
      <span className="card-title">{title}</span>
    </div>
    <div className="card-body">
      <div className="grid g3">{children}</div>
    </div>
  </div>
);

// ── Loss Report Modal ────────────────────────────────────────────
const LossReportModal = ({ serialNumber, onConfirm, onCancel }) => {
  const [form, setForm] = useState({
    dateLost: new Date().toISOString().slice(0, 10),
    circumstances: "",
    lastKnownLocation: "",
    reportedByName: "",
    policeAbstract: "",
  });
  const [incidentFile, setIncidentFile] = useState(null);
  const [policeObFile, setPoliceObFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (
      !form.dateLost ||
      !form.circumstances.trim() ||
      !form.reportedByName.trim()
    ) {
      toast.error("Date lost, circumstances and reporter name are required");
      return;
    }
    setSaving(true);
    try {
      await onConfirm(form, incidentFile, policeObFile);
    } finally {
      setSaving(false);
    }
  };

  const FileInput = ({ label, file, onChange, hint }) => (
    <Field label={label} style={{ gridColumn: "1/-1" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <label
          style={{
            flex: 1,
            cursor: "pointer",
            border: "1px dashed var(--border)",
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: ".84rem",
            color: "var(--text-2)",
            background: file ? "var(--primary-soft,#f5f3ff)" : "transparent",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <input
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => onChange(e.target.files?.[0] || null)}
          />
          📎 {file ? file.name : "Choose PDF…"}
        </label>
        {file && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onChange(null)}
            style={{ color: "var(--danger)", padding: "4px 8px" }}>
            ✕
          </button>
        )}
      </div>
      {hint && (
        <div
          style={{ fontSize: ".75rem", color: "var(--text-3)", marginTop: 4 }}>
          {hint}
        </div>
      )}
    </Field>
  );

  return (
    <div className="overlay" onClick={onCancel}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 className="modal-title">
            🚨 Report Device Lost — {serialNumber}
          </h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCancel}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 18,
              fontSize: ".85rem",
              color: "#991b1b",
            }}>
            This will lock the device from further edits and notify all
            administrators by email.
          </div>
          <div className="grid g2">
            <Field label="Date Lost" required>
              <input
                className="input"
                type="date"
                value={form.dateLost}
                onChange={set("dateLost")}
              />
            </Field>
            <Field label="Reported By (Name)" required>
              <input
                className="input"
                value={form.reportedByName}
                onChange={set("reportedByName")}
                placeholder="Name of person reporting the loss"
              />
            </Field>
            <Field label="Last Known Location">
              <input
                className="input"
                value={form.lastKnownLocation}
                onChange={set("lastKnownLocation")}
                placeholder="Where was it last seen?"
              />
            </Field>
            <Field label="Police Abstract No.">
              <input
                className="input"
                value={form.policeAbstract}
                onChange={set("policeAbstract")}
                placeholder="OB / Abstract reference number"
              />
            </Field>
            <Field
              label="Circumstances"
              required
              style={{ gridColumn: "1/-1" }}>
              <textarea
                className="input"
                rows={3}
                value={form.circumstances}
                onChange={set("circumstances")}
                placeholder="Describe how the device was lost…"
              />
            </Field>
            <FileInput
              label="Incident Report (PDF)"
              file={incidentFile}
              onChange={setIncidentFile}
              hint="Optional — upload the internal incident report"
            />
            <FileInput
              label="Police OB / Abstract (PDF)"
              file={policeObFile}
              onChange={setPoliceObFile}
              hint="Optional — upload the police occurrence book extract"
            />
          </div>
        </div>
        <div className="modal-foot">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            onClick={submit}
            disabled={saving}
            style={{ background: "#dc2626", color: "#fff", border: "none" }}>
            {saving ? (
              <>
                <Spinner size={13} /> Submitting…
              </>
            ) : (
              "🚨 Submit Loss Report"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Transfer Modal ───────────────────────────────────────────────
const TransferModal = ({ device, onClose, onSuccess }) => {
  const [facilities, setFacilities] = useState([]);
  const [counties, setCounties] = useState([]);
  const [county, setCounty] = useState("");
  const [toId, setToId] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    Promise.all([refApi.counties(), refApi.facilities({ limit: 500 })]).then(
      ([c, f]) => {
        setCounties(c.data.data);
        setFacilities(f.data.data.filter((f) => f.id !== device.facility_id));
      },
    );
  }, [device]);

  const filtered = county
    ? facilities.filter((f) => String(f.county_id) === county)
    : facilities;

  const submit = async () => {
    if (!toId) {
      setErr("Select a destination facility");
      return;
    }
    setLoading(true);
    try {
      await deviceApi.transfer(device.id, {
        toFacilityId: parseInt(toId),
        reason,
      });
      toast.success("Device transferred");
      onSuccess();
    } catch (e) {
      setErr(getMsg(e, "Transfer failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Transfer Device"
      footer={
        <>
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}>
            {loading ? (
              <>
                <Spinner size={13} /> Transferring…
              </>
            ) : (
              "Confirm Transfer"
            )}
          </button>
        </>
      }>
      <ErrAlert message={err} />
      <p className="dim mb-16">
        Moving: <strong>{device.serial_number}</strong> from{" "}
        <strong>{device.facility_name}</strong>
      </p>
      <Field label="Filter by County">
        <select
          className="input"
          value={county}
          onChange={(e) => {
            setCounty(e.target.value);
            setToId("");
          }}>
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Destination Facility" required>
        <select
          className="input"
          value={toId}
          onChange={(e) => setToId(e.target.value)}>
          <option value="">Select facility…</option>
          {filtered.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.mfl_code})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Reason for Transfer">
        <textarea
          className="input"
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Optional reason…"
        />
      </Field>
    </Modal>
  );
};

// ── Verify Modal ─────────────────────────────────────────────────
const VerifyModal = ({ device, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    devicePresent: true,
    simPaired: !!device.has_sim,
    coverOk: true,
    powersOn: true,
    emrWorking: true,
    overallStatus: "pass",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showLossForm, setShowLossForm] = useState(false);

  const check = (f) => (e) =>
    setForm((p) => ({
      ...p,
      [f]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async () => {
    // If marked lost, save verification first then open loss report modal
    if (form.overallStatus === "lost") {
      setLoading(true);
      try {
        await deviceApi.verify(device.id, form);
        toast.success("Verification recorded");
        setShowLossForm(true);
      } catch (e) {
        setErr(getMsg(e, "Verification failed"));
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      await deviceApi.verify(device.id, form);
      toast.success("Verification recorded");
      onSuccess();
    } catch (e) {
      setErr(getMsg(e, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLossConfirm = async (lossData, incidentFile, policeObFile) => {
    try {
      const fd = new FormData();
      Object.entries(lossData).forEach(([k, v]) => v && fd.append(k, v));
      if (incidentFile) fd.append("incidentReport", incidentFile);
      if (policeObFile) fd.append("policeOb", policeObFile);
      await deviceApi.reportLost(device.id, fd);
      toast.success(
        "Device marked as lost — administrators have been notified",
      );
      setShowLossForm(false);
      onSuccess();
    } catch (e) {
      toast.error(getMsg(e, "Failed to submit loss report"));
      throw e;
    }
  };

  const CheckItem = ({ field, label }) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}>
      <span style={{ fontSize: ".88rem" }}>{label}</span>
      <label className="toggle">
        <input type="checkbox" checked={form[field]} onChange={check(field)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  if (showLossForm) {
    return (
      <LossReportModal
        serialNumber={device.serial_number}
        onConfirm={handleLossConfirm}
        onCancel={() => {
          setShowLossForm(false);
          onSuccess();
        }}
      />
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Verify — ${device.serial_number}`}
      footer={
        <>
          <button
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={loading}>
            {loading ? (
              <>
                <Spinner size={13} /> Saving…
              </>
            ) : (
              "Record Verification"
            )}
          </button>
        </>
      }>
      <ErrAlert message={err} />
      <CheckItem
        field="devicePresent"
        label="📱 Device is physically present"
      />
      {!!device.has_sim && (
        <CheckItem field="simPaired" label="📡 SIM is still paired to device" />
      )}
      <CheckItem field="coverOk" label="🛡️ Cover condition is acceptable" />
      <CheckItem field="powersOn" label="⚡ Device powers on" />
      <CheckItem field="emrWorking" label="💻 EMR application is working" />
      <Field label="Overall Result" style={{ marginTop: 16 }}>
        <select
          className="input"
          value={form.overallStatus}
          onChange={check("overallStatus")}>
          <option value="pass">Pass ✓</option>
          <option value="partial">Partial ⚠️</option>
          <option value="fail">Fail ✗</option>
          <option value="lost">Lost 🚨</option>
        </select>
      </Field>
      {form.overallStatus === "lost" && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 14px",
            marginTop: 4,
            fontSize: ".84rem",
            color: "#991b1b",
          }}>
          Selecting <strong>Lost</strong> will save this verification then
          prompt you to file a loss report. The device will be locked and admins
          notified.
        </div>
      )}
      <Field label="Notes">
        <textarea
          className="input"
          rows={2}
          value={form.notes}
          onChange={check("notes")}
          placeholder="Any observations…"
        />
      </Field>
    </Modal>
  );
};

// ── Loss Report Card (admin actions) ────────────────────────────
const LossReportCard = ({ device, report, onAction }) => {
  const [action, setAction] = useState("");
  const [notes, setNotes] = useState("");
  const [escalateToIds, setEscalateToIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (action === "escalate") {
      refApi
        .escalationTargets()
        .then((r) => setUsers(r.data.data))
        .catch(() => {});
    }
  }, [action]);

  const statusColor = {
    pending: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
    acknowledged: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    escalated: { bg: "#fff7ed", border: "#fed7aa", text: "#92400e" },
    rejected: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    recovered: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
  }[report.status] || { bg: "#f9fafb", border: "#e5e7eb", text: "#374151" };

  const submit = async () => {
    if (!action) return toast.error("Select an action");
    if (action === "reject" && !notes.trim())
      return toast.error("Reason is required when rejecting");
    if (action === "escalate" && !escalateToIds.length)
      return toast.error("Select at least one user to escalate to");
    setSaving(true);
    try {
      await onAction({
        action,
        adminNotes: notes,
        escalateToUserIds: escalateToIds,
      });
      setAction("");
      setNotes("");
      setEscalateToIds([]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="card mb-16"
      style={{ border: `1px solid ${statusColor.border}` }}>
      <div className="card-head" style={{ background: statusColor.bg }}>
        <span className="card-title" style={{ color: statusColor.text }}>
          🚨 Loss Report —{" "}
          <span style={{ textTransform: "capitalize" }}>{report.status}</span>
        </span>
      </div>
      <div className="card-body">
        <div className="grid g3">
          <F
            label="Date Lost"
            value={
              report.date_lost
                ? format(new Date(report.date_lost), "dd MMM yyyy")
                : null
            }
          />
          <F label="Reported By" value={report.reported_by_name} />
          <F label="Last Known Location" value={report.last_known_location} />
          <F label="Police Abstract" value={report.police_abstract} />
          <F label="Circumstances" value={report.circumstances} />
          {(report.incident_report_path || report.police_ob_path) &&
            (() => {
              const openDoc = async (type, download) => {
                try {
                  const r = await deviceApi.lossDoc(report.device_id, type);
                  const url = URL.createObjectURL(
                    new Blob([r.data], { type: "application/pdf" }),
                  );
                  if (download) {
                    const a = document.createElement("a");
                    a.href = url;
                    a.download =
                      type === "incident"
                        ? "incident-report.pdf"
                        : "police-ob.pdf";
                    a.click();
                  } else {
                    window.open(url, "_blank");
                  }
                  setTimeout(() => URL.revokeObjectURL(url), 10000);
                } catch {
                  toast.error("Could not load document");
                }
              };
              return (
                <>
                  {report.incident_report_path && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontSize: ".7rem",
                          fontWeight: 700,
                          color: "var(--text-3)",
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          marginBottom: 6,
                        }}>
                        Incident Report
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: ".8rem" }}
                          onClick={() => openDoc("incident", false)}>
                          👁 View
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: ".8rem" }}
                          onClick={() => openDoc("incident", true)}>
                          ⬇ Download
                        </button>
                      </div>
                    </div>
                  )}
                  {report.police_ob_path && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontSize: ".7rem",
                          fontWeight: 700,
                          color: "var(--text-3)",
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          marginBottom: 6,
                        }}>
                        Police OB / Abstract
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: ".8rem" }}
                          onClick={() => openDoc("police", false)}>
                          👁 View
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: ".8rem" }}
                          onClick={() => openDoc("police", true)}>
                          ⬇ Download
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          {report.admin_notes && (
            <F label="Admin Notes" value={report.admin_notes} />
          )}
          {report.reviewer_name && (
            <F label="Reviewed By" value={report.reviewer_name} />
          )}
          {report.reviewed_at && (
            <F
              label="Reviewed At"
              value={format(new Date(report.reviewed_at), "dd MMM yyyy HH:mm")}
            />
          )}
        </div>

        {/* Admin actions — only for pending/escalated reports */}
        {["pending", "escalated"].includes(report.status) && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}>
            <div
              style={{
                fontSize: ".78rem",
                fontWeight: 700,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: ".07em",
                marginBottom: 10,
              }}>
              Admin Action
            </div>
            <div className="grid g2" style={{ marginBottom: 12 }}>
              {[
                { val: "acknowledge", label: "✅ Acknowledge" },
                { val: "reject", label: "↩️ Reject / Device Found" },
                { val: "insure", label: "📋 Insurance / Replacement" },
                { val: "escalate", label: "⚠️ Escalate" },
              ].map((opt) => (
                <label
                  key={opt.val}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: `1px solid ${action === opt.val ? "var(--primary)" : "var(--border)"}`,
                    background:
                      action === opt.val
                        ? "var(--primary-soft,#f5f3ff)"
                        : "transparent",
                    fontSize: ".85rem",
                  }}>
                  <input
                    type="radio"
                    name="lossAction"
                    value={opt.val}
                    checked={action === opt.val}
                    onChange={() => setAction(opt.val)}
                    style={{ accentColor: "var(--primary)" }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {action === "escalate" && (
              <Field label="Escalate To" style={{ marginBottom: 12 }}>
                {users.length === 0 ? (
                  <div className="td-dim" style={{ fontSize: ".85rem" }}>
                    Loading users…
                  </div>
                ) : (
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      maxHeight: 180,
                      overflowY: "auto",
                    }}>
                    {users.map((u) => (
                      <label
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          cursor: "pointer",
                          borderBottom: "1px solid var(--border)",
                          background: escalateToIds.includes(u.id)
                            ? "var(--accent-bg)"
                            : "transparent",
                        }}>
                        <input
                          type="checkbox"
                          checked={escalateToIds.includes(u.id)}
                          onChange={() =>
                            setEscalateToIds((p) =>
                              p.includes(u.id)
                                ? p.filter((x) => x !== u.id)
                                : [...p, u.id],
                            )
                          }
                          style={{
                            accentColor: "var(--primary)",
                            width: 15,
                            height: 15,
                          }}
                        />
                        <span
                          style={{
                            flex: 1,
                            fontSize: ".875rem",
                            fontWeight: 600,
                          }}>
                          {u.full_name}
                        </span>
                        <span className="td-dim" style={{ fontSize: ".75rem" }}>
                          {u.role_label || u.role}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {escalateToIds.length > 0 && (
                  <div
                    style={{
                      fontSize: ".78rem",
                      color: "var(--primary)",
                      marginTop: 5,
                      fontWeight: 600,
                    }}>
                    {escalateToIds.length} user
                    {escalateToIds.length > 1 ? "s" : ""} selected
                  </div>
                )}
              </Field>
            )}

            <Field
              label={action === "reject" ? "Reason (required)" : "Admin Notes"}>
              <textarea
                className="input"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  action === "reject"
                    ? "Why is this being rejected?"
                    : "Optional notes…"
                }
              />
            </Field>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 8,
              }}>
              <button
                className="btn btn-primary"
                onClick={submit}
                disabled={saving || !action}>
                {saving ? (
                  <>
                    <Spinner size={13} /> Saving…
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Recover button — shown for acknowledged/escalated/pending lost devices */}
        {device.status === "lost" &&
          !["rejected", "recovered"].includes(report.status) && (
            <RecoverSection deviceId={device.id} onAction={onAction} />
          )}
      </div>
    </div>
  );
};

const RecoverSection = ({ deviceId, onAction }) => {
  const [show, setShow] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!notes.trim()) return toast.error("Recovery reason is required");
    setSaving(true);
    try {
      await onAction({ action: "recover", adminNotes: notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: "1px solid var(--border)",
      }}>
      {!show ? (
        <button
          className="btn btn-outline btn-sm"
          onClick={() => setShow(true)}
          style={{ borderColor: "#16a34a", color: "#16a34a" }}>
          ✅ Mark as Recovered
        </button>
      ) : (
        <>
          <Field label="Recovery Reason (required)">
            <textarea
              className="input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was the device found / recovered?"
              autoFocus
            />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShow(false)}>
              Cancel
            </button>
            <button
              className="btn btn-sm"
              onClick={submit}
              disabled={saving}
              style={{
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "6px 14px",
                fontSize: ".84rem",
              }}>
              {saving ? <Spinner size={12} /> : "Confirm Recovery"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────
export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOfficer, isAdmin } = useAuth();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const load = () => {
    setLoading(true);
    deviceApi
      .get(id)
      .then((r) => setDevice(r.data.data))
      .catch((e) => {
        toast.error(getMsg(e, "Device not found"));
        navigate("/devices");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleLossAction = async (payload) => {
    try {
      if (payload.action === "recover") {
        await deviceApi.recover(device.id, { adminNotes: payload.adminNotes });
        toast.success("Device recovered and unlocked");
      } else {
        await deviceApi.reviewLoss(device.id, payload);
        toast.success("Loss report updated");
      }
      load();
    } catch (e) {
      toast.error(getMsg(e, "Action failed"));
      throw e;
    }
  };

  if (loading)
    return (
      <AppShell title="Device">
        <PageLoader />
      </AppShell>
    );
  if (!device) return null;

  const isLocked = !!device.locked;
  const canVerify = isOfficer && !isLocked && device.status !== "lost";
  const canEdit = isOfficer && (!isLocked || isAdmin);

  return (
    <AppShell title={device.serial_number}>
      <div className="page-hd">
        <div>
          <button
            className="btn btn-ghost btn-sm mb-8"
            onClick={() => navigate("/devices")}>
            <RiArrowLeftLine size={13} /> Back to devices
          </button>
          <h1
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}>
            {device.serial_number}
            <StatusBadge status={device.status} />
            <SimBadge hasSim={!!device.has_sim} />
            {isLocked && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: ".7rem",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 20,
                  background: "#fef2f2",
                  color: "#991b1b",
                  border: "1px solid #fecaca",
                }}>
                <RiLockLine size={11} /> LOCKED
              </span>
            )}
          </h1>
          <p>
            {device.facility_name} · {device.mfl_code} · {device.county}
          </p>
        </div>
        <div className="hd-actions">
          {isAdmin && !isLocked && (
            <button
              className="btn btn-outline"
              onClick={() => setShowTransfer(true)}>
              <RiExchangeLine size={14} /> Transfer
            </button>
          )}
          {canVerify && (
            <button
              className="btn btn-outline"
              onClick={() => setShowVerify(true)}>
              <RiShieldCheckLine size={14} /> Verify
            </button>
          )}
          {canEdit && (
            <button
              className="btn btn-primary"
              onClick={() => setShowEdit(true)}>
              <RiEditLine size={14} /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Loss Report Card — shown when device has a loss report */}
      {device.lossReport && isAdmin && (
        <LossReportCard
          device={device}
          report={device.lossReport}
          onAction={handleLossAction}
        />
      )}
      {/* Non-admin view of loss status */}
      {device.lossReport && !isAdmin && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            fontSize: ".87rem",
            color: "#991b1b",
          }}>
          🚨 This device has been reported lost and is pending admin review.
          <strong style={{ marginLeft: 4, textTransform: "capitalize" }}>
            {device.lossReport.status}
          </strong>
        </div>
      )}

      <Section title="Device Details">
        <F label="Serial Number" value={device.serial_number} />
        <F label="IMEI" value={device.imei} />
        <F label="Model" value={device.model} />
        <F label="Asset Tag" value={device.asset_tag} />
        <F label="IP Address" value={device.ip_address} />
        <F label="Cover Condition" value={device.cover_condition} />
        {device.cover_notes && (
          <F label="Cover Notes" value={device.cover_notes} />
        )}
        <F
          label="Date Issued"
          value={
            device.date_issued
              ? format(new Date(device.date_issued), "dd MMM yyyy")
              : null
          }
        />
        <F label="Assigned To" value={device.assigned_to} />
        <F label="Notes" value={device.notes} />
      </Section>

      <Section title="Facility &amp; Organisation">
        <F label="Facility" value={device.facility_name} />
        <F label="MFL Code" value={device.mfl_code} />
        <F label="County" value={device.county} />
        <F label="Sub-County" value={device.sub_county} />
        <F label="Affiliation" value={device.affiliation} />
      </Section>

      <Section title="SIM Card">
        {device.has_sim ? (
          <>
            <F label="Phone Number" value={device.phone_number} />
            <F label="SIM Serial" value={device.sim_serial} />
            <F label="Network" value={device.network} />
            <F label="PIN" value={device.pin} />
            <F label="PUK" value={device.puk} />
          </>
        ) : (
          <div
            style={{
              gridColumn: "1/-1",
              color: "var(--text-3)",
              fontSize: ".87rem",
            }}>
            WiFi-only device — no SIM card recorded.
          </div>
        )}
      </Section>

      {device.transfers?.length > 0 && (
        <div className="card mb-16">
          <div className="card-head">
            <span className="card-title">Transfer History</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Transferred By</th>
                  <th>Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {device.transfers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.from_facility}{" "}
                      <span className="td-dim">({t.from_mfl})</span>
                    </td>
                    <td>
                      {t.to_facility}{" "}
                      <span className="td-dim">({t.to_mfl})</span>
                    </td>
                    <td className="td-dim">{t.transferred_by_name}</td>
                    <td className="td-dim">
                      {format(new Date(t.transferred_at), "dd MMM yyyy")}
                    </td>
                    <td className="td-dim">{t.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head">
          <span className="card-title">Verification History</span>
          <span className="dim">
            {device.verifications?.length ?? 0} records
          </span>
        </div>
        {!device.verifications?.length ? (
          <Empty
            title="No verifications yet"
            sub="Use the Verify button to record an annual check"
          />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Result</th>
                  <th>Present</th>
                  <th>SIM</th>
                  <th>Cover</th>
                  <th>Powers On</th>
                  <th>EMR</th>
                  <th>By</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {device.verifications.map((v) => (
                  <tr key={v.id}>
                    <td>{format(new Date(v.verified_at), "dd MMM yyyy")}</td>
                    <td>
                      <StatusBadge status={v.overall_status} />
                    </td>
                    <td>{v.device_present ? "✅" : "❌"}</td>
                    <td>{v.sim_paired ? "✅" : "❌"}</td>
                    <td>{v.cover_ok ? "✅" : "❌"}</td>
                    <td>{v.powers_on ? "✅" : "❌"}</td>
                    <td>{v.emr_working ? "✅" : "❌"}</td>
                    <td className="td-dim">{v.verified_by_name}</td>
                    <td className="td-dim">{v.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEdit && (
        <DeviceFormModal
          device={device}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            load();
          }}
        />
      )}
      {showVerify && (
        <VerifyModal
          device={device}
          onClose={() => setShowVerify(false)}
          onSuccess={() => {
            setShowVerify(false);
            load();
          }}
        />
      )}
      {showTransfer && (
        <TransferModal
          device={device}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            setShowTransfer(false);
            load();
          }}
        />
      )}
    </AppShell>
  );
}
