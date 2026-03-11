import { useState, useEffect } from "react";
import { refApi, deviceApi, getMsg } from "../api";
import {
  Modal,
  Field,
  ErrAlert,
  Spinner,
  SectionLabel,
} from "../components/common";
import { useAuth } from "../contexts";
import toast from "react-hot-toast";

const EMPTY = {
  facilityId: "",
  affiliationId: "",
  serialNumber: "",
  imei: "",
  model: "",
  assetTag: "",
  ipAddress: "",
  coverCondition: "good",
  coverNotes: "",
  dateIssued: "",
  assignedTo: "",
  status: "active",
  notes: "",
  hasSim: false,
  simSerial: "",
  phoneNumber: "",
  pin: "",
  puk: "",
  network: "",
};

const validate = (f) => {
  const e = {};
  if (!f.serialNumber.trim()) e.serialNumber = "Serial number is required";
  if (!f.facilityId) e.facilityId = "Facility is required";
  if (!f.affiliationId) e.affiliationId = "Affiliation is required";
  if (f.hasSim && !f.simSerial && !f.phoneNumber)
    e.simSerial = "Enter at least the SIM serial or phone number";
  return e;
};

// ── Loss Report Modal (shown when status → lost) ─────────────────
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
              background: "var(--danger-bg,#fef2f2)",
              border: "1px solid var(--danger-border,#fecaca)",
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

export default function DeviceFormModal({ device, onClose, onSuccess }) {
  const isEdit = !!device;
  const { isAdmin } = useAuth();
  const [form, setForm] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [apiErr, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);

  const [counties, setCounties] = useState([]);
  const [affiliations, setAffiliations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [newAff, setNewAff] = useState("");
  const [addingAff, setAddingAff] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState("");

  useEffect(() => {
    Promise.all([
      refApi.counties(),
      refApi.affiliations(),
      refApi.facilities({ limit: 500 }),
    ]).then(([c, a, f]) => {
      setCounties(c.data.data);
      setAffiliations(a.data.data);
      setFacilities(f.data.data);
    });
  }, []);

  useEffect(() => {
    if (device) {
      setForm({
        facilityId: device.facility_id || "",
        affiliationId: device.affiliation_id || "",
        serialNumber: device.serial_number || "",
        imei: device.imei || "",
        model: device.model || "",
        assetTag: device.asset_tag || "",
        ipAddress: device.ip_address || "",
        coverCondition: device.cover_condition || "good",
        coverNotes: device.cover_notes || "",
        dateIssued: device.date_issued?.slice(0, 10) || "",
        assignedTo: device.assigned_to || "",
        status: device.status || "active",
        notes: device.notes || "",
        hasSim: !!device.has_sim,
        simSerial: device.sim_serial || "",
        phoneNumber: device.phone_number || "",
        pin: device.pin || "",
        puk: device.puk || "",
        network: device.network || "",
      });
    }
  }, [device]);

  const set = (f) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    // Intercept lost status
    if (f === "status" && val === "lost" && isEdit) {
      setShowLossModal(true);
      return;
    }
    setForm((p) => ({ ...p, [f]: val }));
    if (errs[f]) setErrs((er) => ({ ...er, [f]: "" }));
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
      setShowLossModal(false);
      onSuccess();
    } catch (e) {
      toast.error(getMsg(e, "Failed to submit loss report"));
      throw e;
    }
  };

  const handleAddAffiliation = async () => {
    if (!newAff.trim()) return;
    setAddingAff(true);
    try {
      const r = await refApi.createAffiliation({ name: newAff.trim() });
      const created = r.data.data;
      setAffiliations((a) => [...a, created]);
      setForm((f) => ({ ...f, affiliationId: String(created.id) }));
      setNewAff("");
      toast.success("Affiliation added");
    } catch (e) {
      toast.error(getMsg(e, "Failed to add affiliation"));
    } finally {
      setAddingAff(false);
    }
  };

  const submit = async () => {
    setApiErr("");
    const e = validate(form);
    if (Object.keys(e).length) {
      setErrs(e);
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await deviceApi.update(device.id, form);
        toast.success("Device updated");
      } else {
        await deviceApi.create(form);
        toast.success("Device added");
      }
      onSuccess();
    } catch (err) {
      setApiErr(getMsg(err, "Failed to save device"));
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = selectedCounty
    ? facilities.filter((f) => String(f.county_id) === String(selectedCounty))
    : facilities;

  const isLocked = device?.locked;

  return (
    <>
      <Modal
        open
        onClose={onClose}
        size="modal-lg"
        title={
          isEdit ? `Edit Device — ${device.serial_number}` : "Add New Device"
        }
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
              ) : isEdit ? (
                "Update"
              ) : (
                "Add Device"
              )}
            </button>
          </>
        }>
        {isLocked && (
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
            🔒 This device is locked pending loss report review by an
            administrator.
            {!isAdmin && " Contact an admin to make changes."}
          </div>
        )}

        <ErrAlert message={apiErr} />

        <SectionLabel>Device Details</SectionLabel>
        <div className="grid g2">
          <Field label="Serial Number" required error={errs.serialNumber}>
            <input
              className={`input ${errs.serialNumber ? "err" : ""}`}
              value={form.serialNumber}
              onChange={set("serialNumber")}
              placeholder="e.g. RF8N31ABCDE"
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="IMEI">
            <input
              className="input"
              value={form.imei}
              onChange={set("imei")}
              placeholder="15-digit IMEI"
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="Model">
            <input
              className="input"
              value={form.model}
              onChange={set("model")}
              placeholder="e.g. Samsung Tab A8"
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="Asset Tag">
            <input
              className="input"
              value={form.assetTag}
              onChange={set("assetTag")}
              placeholder="e.g. HF-0042"
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="IP Address">
            <input
              className="input"
              value={form.ipAddress}
              onChange={set("ipAddress")}
              placeholder="192.168.x.x"
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="Date Issued">
            <input
              className="input"
              type="date"
              value={form.dateIssued}
              onChange={set("dateIssued")}
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="Cover Condition">
            <select
              className="input"
              value={form.coverCondition}
              onChange={set("coverCondition")}
              disabled={isLocked && !isAdmin}>
              <option value="good">Good</option>
              <option value="damaged">Damaged</option>
              <option value="missing">Missing</option>
              <option value="replaced">Replaced</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={set("status")}
              disabled={isLocked && !isAdmin}>
              <option value="active">Active</option>
              <option value="under_repair">Under Repair</option>
              <option value="decommissioned">Decommissioned</option>
              <option value="lost">Lost</option>
            </select>
          </Field>
          {form.coverCondition !== "good" && (
            <Field label="Cover Notes" style={{ gridColumn: "1/-1" }}>
              <input
                className="input"
                value={form.coverNotes}
                onChange={set("coverNotes")}
                placeholder="Describe the cover issue"
                disabled={isLocked && !isAdmin}
              />
            </Field>
          )}
        </div>

        <SectionLabel>Facility &amp; Assignment</SectionLabel>
        <div className="grid g2">
          <Field label="Filter by County">
            <select
              className="input"
              value={selectedCounty}
              onChange={(e) => {
                setSelectedCounty(e.target.value);
                setForm((f) => ({ ...f, facilityId: "" }));
              }}>
              <option value="">All counties</option>
              {counties.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Facility" required error={errs.facilityId}>
            <select
              className={`input ${errs.facilityId ? "err" : ""}`}
              value={form.facilityId}
              onChange={set("facilityId")}
              disabled={isLocked && !isAdmin}>
              <option value="">Select facility…</option>
              {filteredFacilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.mfl_code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned To (person)">
            <input
              className="input"
              value={form.assignedTo}
              onChange={set("assignedTo")}
              placeholder="Name of person responsible"
              disabled={isLocked && !isAdmin}
            />
          </Field>
          <Field label="Notes">
            <input
              className="input"
              value={form.notes}
              onChange={set("notes")}
              placeholder="Any additional notes"
              disabled={isLocked && !isAdmin}
            />
          </Field>
        </div>

        <SectionLabel>Issuing Organisation</SectionLabel>
        <Field label="Affiliation" required error={errs.affiliationId}>
          <select
            className={`input ${errs.affiliationId ? "err" : ""}`}
            value={form.affiliationId}
            onChange={set("affiliationId")}
            disabled={isLocked && !isAdmin}>
            <option value="">Select organisation…</option>
            {affiliations.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <div
          style={{ display: "flex", gap: 8, marginTop: -8, marginBottom: 16 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            value={newAff}
            onChange={(e) => setNewAff(e.target.value)}
            placeholder="Or type a new organisation name…"
            onKeyDown={(e) => e.key === "Enter" && handleAddAffiliation()}
          />
          <button
            className="btn btn-outline btn-sm"
            onClick={handleAddAffiliation}
            disabled={addingAff || !newAff.trim()}>
            {addingAff ? <Spinner size={12} /> : "+ Add"}
          </button>
        </div>

        <SectionLabel>SIM Card</SectionLabel>
        <div className="toggle-wrap mb-16">
          <label className="toggle">
            <input
              type="checkbox"
              checked={form.hasSim}
              onChange={set("hasSim")}
              disabled={isLocked && !isAdmin}
            />
            <span className="toggle-slider" />
          </label>
          <span className="toggle-label">
            {form.hasSim ? "Device has a SIM card" : "No SIM card (WiFi only)"}
          </span>
        </div>

        {form.hasSim && (
          <div className="grid g2">
            <Field label="SIM Serial" error={errs.simSerial}>
              <input
                className={`input ${errs.simSerial ? "err" : ""}`}
                value={form.simSerial}
                onChange={set("simSerial")}
                placeholder="SIM serial / ICCID"
                disabled={isLocked && !isAdmin}
              />
            </Field>
            <Field label="Phone Number">
              <input
                className="input"
                value={form.phoneNumber}
                onChange={set("phoneNumber")}
                placeholder="e.g. 0712345678"
                disabled={isLocked && !isAdmin}
              />
            </Field>
            <Field label="Network">
              <input
                className="input"
                value={form.network}
                onChange={set("network")}
                placeholder="e.g. Safaricom"
                disabled={isLocked && !isAdmin}
              />
            </Field>
            <div />
            <Field label="PIN">
              <input
                className="input"
                type="password"
                value={form.pin}
                onChange={set("pin")}
                placeholder="SIM PIN"
                autoComplete="new-password"
                disabled={isLocked && !isAdmin}
              />
            </Field>
            <Field label="PUK">
              <input
                className="input"
                type="password"
                value={form.puk}
                onChange={set("puk")}
                placeholder="SIM PUK"
                autoComplete="new-password"
                disabled={isLocked && !isAdmin}
              />
            </Field>
          </div>
        )}
      </Modal>

      {showLossModal && (
        <LossReportModal
          serialNumber={device?.serial_number}
          onConfirm={handleLossConfirm}
          onCancel={() => setShowLossModal(false)}
        />
      )}
    </>
  );
}
