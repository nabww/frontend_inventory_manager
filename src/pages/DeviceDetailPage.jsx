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
  RiArrowRightUpLine,
  RiExchangeLine,
} from "react-icons/ri";
import { useAuth } from "../contexts";
import { format, formatDistanceToNow } from "date-fns";
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

// ── Transfer Modal
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

// ── Verify Modal
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

  const check = (f) => (e) =>
    setForm((p) => ({
      ...p,
      [f]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async () => {
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
      {device.has_sim && (
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
        </select>
      </Field>
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

  if (loading)
    return (
      <AppShell title="Device">
        <PageLoader />
      </AppShell>
    );
  if (!device) return null;

  return (
    <AppShell title={device.serial_number}>
      <div className="page-hd">
        <div>
          <button
            className="btn btn-ghost btn-sm mb-8"
            onClick={() => navigate("/devices")}>
            <RiArrowLeftLine size={13} /> Back to devices
          </button>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {device.serial_number}
            <StatusBadge status={device.status} />
            <SimBadge hasSim={device.has_sim} />
          </h1>
          <p>
            {device.facility_name} · {device.mfl_code} · {device.county}
          </p>
        </div>
        {isOfficer && (
          <div className="hd-actions">
            {isAdmin && (
              <button
                className="btn btn-outline"
                onClick={() => setShowTransfer(true)}>
                <RiExchangeLine size={14} /> Transfer
              </button>
            )}

            <button
              className="btn btn-outline"
              onClick={() => setShowVerify(true)}>
              <RiShieldCheckLine size={14} /> Verify
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setShowEdit(true)}>
              <RiEditLine size={14} /> Edit
            </button>
          </div>
        )}
      </div>

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
            <F label="PIN" value={device.pin ? "••••" : null} />
            <F label="PUK" value={device.puk ? "••••" : null} />
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

      {/* Transfer history */}
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

      {/* Verification history */}
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
