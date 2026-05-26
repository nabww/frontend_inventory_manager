import { useState, useEffect } from "react";
import { refApi, getMsg } from "../api";
import {
  Modal,
  Field,
  ErrAlert,
  Spinner,
  SectionLabel,
} from "../components/common";
import toast from "react-hot-toast";
import { useAuth } from "../contexts";

export default function FacilityFormModal({ facility, onClose, onSuccess }) {
  const isEdit = !!facility;
  const [form, setForm] = useState({
    mflCode: "",
    name: "",
    countyId: "",
    subCountyId: "",
  });
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [allSDPs, setAllSDPs] = useState([]);
  const [facilitySDPs, setFacilitySDPs] = useState({}); // key = sdpId, value = { providerCount, isActive }
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [errs, setErrs] = useState({});

  useEffect(() => {
    // Load counties, SDPs, and if editing, load facility details + current SDPs
    Promise.all([
      refApi.counties(),
      refApi.sdps(),
      isEdit
        ? refApi.get(`/facilities/${facility.id}/all-sdps`)
        : Promise.resolve({ data: { data: [] } }),
    ]).then(([cRes, sdpRes, fsRes]) => {
      setCounties(cRes.data.data);
      setAllSDPs(sdpRes.data.data);
      const existing = {};
      (fsRes.data.data || []).forEach((s) => {
        existing[s.sdp_id] = {
          providerCount: s.provider_count,
          isActive: s.is_active,
        };
      });
      setFacilitySDPs(existing);
    });
  }, [facility, isEdit]);

  useEffect(() => {
    if (facility && isEdit) {
      setForm({
        mflCode: facility.mfl_code || "",
        name: facility.name || "",
        countyId: facility.county_id || "",
        subCountyId: facility.sub_county_id || "",
      });
      // Load sub-counties for the selected county
      if (facility.county_id) {
        refApi
          .subCounties(facility.county_id)
          .then((res) => setSubCounties(res.data.data));
      }
    }
  }, [facility, isEdit]);

  const handleCountyChange = async (countyId) => {
    setForm((f) => ({ ...f, countyId, subCountyId: "" }));
    if (countyId) {
      const res = await refApi.subCounties(countyId);
      setSubCounties(res.data.data);
    } else {
      setSubCounties([]);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.mflCode.trim()) e.mflCode = "MFL code is required";
    if (!form.name.trim()) e.name = "Facility name is required";
    if (!form.countyId) e.countyId = "County is required";
    if (Object.keys(e).length) {
      setErrs(e);
      return false;
    }
    return true;
  };

  const handleSDPChange = (sdpId, field, value) => {
    setFacilitySDPs((prev) => ({
      ...prev,
      [sdpId]: {
        ...prev[sdpId],
        [field]: field === "providerCount" ? parseInt(value) || 0 : value,
      },
    }));
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiErr("");
    try {
      // First create/update facility
      let facilityId = facility?.id;
      if (isEdit) {
        // await refApi.put(`/facilities/${facilityId}`, form);
        await refApi.patch(`/facilities/${facilityId}`, form);
      } else {
        const res = await refApi.post("/facilities", form);
        facilityId = res.data.data.id;
      }
      // Then update SDPs
      const sdpPayload = {
        sdps: Object.entries(facilitySDPs).map(([sdpId, data]) => ({
          sdpId: parseInt(sdpId),
          providerCount: data.providerCount || 0,
          isActive: data.isActive || false,
        })),
      };
      await refApi.put(`/facilities/${facilityId}/sdps`, sdpPayload);
      toast.success(isEdit ? "Facility updated" : "Facility created");
      onSuccess();
    } catch (err) {
      setApiErr(getMsg(err, "Failed to save facility"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Facility" : "Add Facility"}
      size="modal-lg">
      <ErrAlert message={apiErr} />
      <SectionLabel>Basic Information</SectionLabel>
      <div className="grid g2">
        <Field label="MFL Code" required error={errs.mflCode}>
          <input
            className="input"
            value={form.mflCode}
            onChange={(e) => setForm({ ...form, mflCode: e.target.value })}
          />
        </Field>
        <Field label="Facility Name" required error={errs.name}>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="County" required error={errs.countyId}>
          <select
            className="input"
            value={form.countyId}
            onChange={(e) => handleCountyChange(e.target.value)}>
            <option value="">Select county</option>
            {counties.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sub-county">
          <select
            className="input"
            value={form.subCountyId}
            onChange={(e) => setForm({ ...form, subCountyId: e.target.value })}>
            <option value="">Select sub-county</option>
            {subCounties.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <SectionLabel>Service Delivery Points (active & providers)</SectionLabel>
      <div style={{ overflowX: "auto" }}>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Active</th>
              <th>SDP</th>
              <th>Number of Providers</th>
            </tr>
          </thead>
          <tbody>
            {allSDPs.map((sdp) => {
              const current = facilitySDPs[sdp.id] || {
                providerCount: 0,
                isActive: false,
              };
              return (
                <tr key={sdp.id}>
                  <td style={{ width: 80 }}>
                    <td style={{ width: 80, textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={current.isActive}
                        onChange={(e) =>
                          handleSDPChange(sdp.id, "isActive", e.target.checked)
                        }
                        style={{
                          width: 18,
                          height: 18,
                          cursor: "pointer",
                          accentColor: "var(--primary, #7c3aed)", // purple when checked
                          outline: "1px solid var(--border, #ccc)", // optional: gives a light border for visibility
                          borderRadius: 3,
                        }}
                      />
                    </td>
                  </td>
                  <td>{sdp.name}</td>
                  <td style={{ width: 140 }}>
                    {current.isActive ? (
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="input"
                        style={{ width: 100 }}
                        value={current.providerCount}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          handleSDPChange(sdp.id, "providerCount", val);
                        }}
                        placeholder="0"
                      />
                    ) : (
                      <span
                        style={{ color: "var(--text-3)", fontSize: ".85rem" }}>
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="modal-foot">
        <button
          className="btn btn-outline"
          onClick={onClose}
          disabled={loading}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <Spinner size={13} /> : isEdit ? "Update" : "Create"}
        </button>
      </div>
    </Modal>
  );
}
