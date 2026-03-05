import { useState, useEffect } from 'react';
import { refApi, deviceApi, getMsg } from '../api';
import { Modal, Field, ErrAlert, Spinner, SectionLabel } from '../components/common';
import toast from 'react-hot-toast';

const EMPTY = {
  facilityId:'', affiliationId:'', serialNumber:'', imei:'', model:'',
  assetTag:'', ipAddress:'', coverCondition:'good', coverNotes:'',
  dateIssued:'', assignedTo:'', status:'active', notes:'',
  // SIM
  hasSim: false, simSerial:'', phoneNumber:'', pin:'', puk:'', network:'',
};

const validate = f => {
  const e = {};
  if (!f.serialNumber.trim()) e.serialNumber = 'Serial number is required';
  if (!f.facilityId)          e.facilityId   = 'Facility is required';
  if (!f.affiliationId)       e.affiliationId = 'Affiliation is required';
  if (f.hasSim && !f.simSerial && !f.phoneNumber)
    e.simSerial = 'Enter at least the SIM serial or phone number';
  return e;
};

export default function DeviceFormModal({ device, onClose, onSuccess }) {
  const isEdit = !!device;
  const [form, setForm]       = useState(EMPTY);
  const [errs, setErrs]       = useState({});
  const [apiErr, setApiErr]   = useState('');
  const [loading, setLoading] = useState(false);

  // Reference data
  const [counties,      setCounties]      = useState([]);
  const [subCounties,   setSubCounties]   = useState([]);
  const [affiliations,  setAffiliations]  = useState([]);
  const [facilities,    setFacilities]    = useState([]);
  const [newAff,        setNewAff]        = useState('');
  const [addingAff,     setAddingAff]     = useState(false);
  const [selectedCounty, setSelectedCounty] = useState('');

  useEffect(() => {
    Promise.all([refApi.counties(), refApi.affiliations(), refApi.facilities({limit:500})])
      .then(([c, a, f]) => {
        setCounties(c.data.data);
        setAffiliations(a.data.data);
        setFacilities(f.data.data);
      });
  }, []);

  useEffect(() => {
    if (selectedCounty) {
      refApi.subCounties(selectedCounty).then(r => setSubCounties(r.data.data));
    } else {
      setSubCounties([]);
    }
  }, [selectedCounty]);

  useEffect(() => {
    if (device) {
      setForm({
        facilityId:     device.facility_id     || '',
        affiliationId:  device.affiliation_id  || '',
        serialNumber:   device.serial_number   || '',
        imei:           device.imei            || '',
        model:          device.model           || '',
        assetTag:       device.asset_tag       || '',
        ipAddress:      device.ip_address      || '',
        coverCondition: device.cover_condition || 'good',
        coverNotes:     device.cover_notes     || '',
        dateIssued:     device.date_issued?.slice(0,10) || '',
        assignedTo:     device.assigned_to     || '',
        status:         device.status          || 'active',
        notes:          device.notes           || '',
        hasSim:         !!device.has_sim,
        simSerial:      device.sim_serial      || '',
        phoneNumber:    device.phone_number    || '',
        pin:            device.pin             || '',
        puk:            device.puk             || '',
        network:        device.network         || '',
      });
    }
  }, [device]);

  const set = f => e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(p => ({...p, [f]: val}));
    if (errs[f]) setErrs(er => ({...er, [f]:''}));
  };

  const handleAddAffiliation = async () => {
    if (!newAff.trim()) return;
    setAddingAff(true);
    try {
      const r = await refApi.createAffiliation({ name: newAff.trim() });
      const created = r.data.data;
      setAffiliations(a => [...a, created]);
      setForm(f => ({...f, affiliationId: String(created.id)}));
      setNewAff('');
      toast.success('Affiliation added');
    } catch (e) {
      toast.error(getMsg(e, 'Failed to add affiliation'));
    } finally { setAddingAff(false); }
  };

  const submit = async () => {
    setApiErr('');
    const e = validate(form);
    if (Object.keys(e).length) { setErrs(e); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await deviceApi.update(device.id, form);
        toast.success('Device updated');
      } else {
        await deviceApi.create(form);
        toast.success('Device added');
      }
      onSuccess();
    } catch (err) {
      setApiErr(getMsg(err, 'Failed to save device'));
    } finally { setLoading(false); }
  };

  // Filtered facilities by selected county
  const filteredFacilities = selectedCounty
    ? facilities.filter(f => String(f.county_id) === String(selectedCounty))
    : facilities;

  return (
    <Modal open onClose={onClose} size="modal-lg"
      title={isEdit ? `Edit Device — ${device.serial_number}` : 'Add New Device'}
      footer={<>
        <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
        <button className="btn btn-primary" onClick={submit} disabled={loading}>
          {loading ? <><Spinner size={13}/> Saving…</> : isEdit ? 'Update' : 'Add Device'}
        </button>
      </>}
    >
      <ErrAlert message={apiErr} />

      {/* ── Device Info */}
      <SectionLabel>Device Details</SectionLabel>
      <div className="grid g2">
        <Field label="Serial Number" required error={errs.serialNumber}>
          <input className={`input ${errs.serialNumber?'err':''}`} value={form.serialNumber}
            onChange={set('serialNumber')} placeholder="e.g. RF8N31ABCDE" />
        </Field>
        <Field label="IMEI">
          <input className="input" value={form.imei} onChange={set('imei')} placeholder="15-digit IMEI" />
        </Field>
        <Field label="Model">
          <input className="input" value={form.model} onChange={set('model')} placeholder="e.g. Samsung Tab A8" />
        </Field>
        <Field label="Asset Tag">
          <input className="input" value={form.assetTag} onChange={set('assetTag')} placeholder="e.g. HF-0042" />
        </Field>
        <Field label="IP Address">
          <input className="input" value={form.ipAddress} onChange={set('ipAddress')} placeholder="192.168.x.x" />
        </Field>
        <Field label="Date Issued">
          <input className="input" type="date" value={form.dateIssued} onChange={set('dateIssued')} />
        </Field>
        <Field label="Cover Condition">
          <select className="input" value={form.coverCondition} onChange={set('coverCondition')}>
            <option value="good">Good</option>
            <option value="damaged">Damaged</option>
            <option value="missing">Missing</option>
            <option value="replaced">Replaced</option>
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={form.status} onChange={set('status')}>
            <option value="active">Active</option>
            <option value="under_repair">Under Repair</option>
            <option value="decommissioned">Decommissioned</option>
            <option value="lost">Lost</option>
          </select>
        </Field>
        {form.coverCondition !== 'good' && (
          <Field label="Cover Notes" style={{gridColumn:'1/-1'}}>
            <input className="input" value={form.coverNotes} onChange={set('coverNotes')} placeholder="Describe the cover issue" />
          </Field>
        )}
      </div>

      {/* ── Facility / Assignment */}
      <SectionLabel>Facility &amp; Assignment</SectionLabel>
      <div className="grid g2">
        <Field label="Filter by County">
          <select className="input" value={selectedCounty} onChange={e => { setSelectedCounty(e.target.value); setForm(f => ({...f, facilityId:''})); }}>
            <option value="">All counties</option>
            {counties.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Facility" required error={errs.facilityId}>
          <select className={`input ${errs.facilityId?'err':''}`} value={form.facilityId} onChange={set('facilityId')}>
            <option value="">Select facility…</option>
            {filteredFacilities.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.mfl_code})</option>
            ))}
          </select>
        </Field>
        <Field label="Assigned To (person)">
          <input className="input" value={form.assignedTo} onChange={set('assignedTo')} placeholder="Name of person responsible" />
        </Field>
        <Field label="Notes">
          <input className="input" value={form.notes} onChange={set('notes')} placeholder="Any additional notes" />
        </Field>
      </div>

      {/* ── Affiliation */}
      <SectionLabel>Issuing Organisation</SectionLabel>
      <Field label="Affiliation" required error={errs.affiliationId}>
        <select className={`input ${errs.affiliationId?'err':''}`} value={form.affiliationId} onChange={set('affiliationId')}>
          <option value="">Select organisation…</option>
          {affiliations.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      {/* Add new affiliation inline */}
      <div style={{display:'flex', gap:8, marginTop:-8, marginBottom:16}}>
        <input className="input" style={{flex:1}} value={newAff} onChange={e => setNewAff(e.target.value)}
          placeholder="Or type a new organisation name…" onKeyDown={e => e.key==='Enter' && handleAddAffiliation()} />
        <button className="btn btn-outline btn-sm" onClick={handleAddAffiliation} disabled={addingAff||!newAff.trim()}>
          {addingAff ? <Spinner size={12}/> : '+ Add'}
        </button>
      </div>

      {/* ── SIM Card */}
      <SectionLabel>SIM Card</SectionLabel>

      {/* Toggle */}
      <div className="toggle-wrap mb-16">
        <label className="toggle">
          <input type="checkbox" checked={form.hasSim} onChange={set('hasSim')} />
          <span className="toggle-slider" />
        </label>
        <span className="toggle-label">{form.hasSim ? 'Device has a SIM card' : 'No SIM card (WiFi only)'}</span>
      </div>

      {form.hasSim && (
        <div className="grid g2">
          <Field label="SIM Serial" error={errs.simSerial}>
            <input className={`input ${errs.simSerial?'err':''}`} value={form.simSerial}
              onChange={set('simSerial')} placeholder="SIM serial / ICCID" />
          </Field>
          <Field label="Phone Number">
            <input className="input" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="e.g. 0712345678" />
          </Field>
          <Field label="Network">
            <input className="input" value={form.network} onChange={set('network')} placeholder="e.g. Safaricom" />
          </Field>
          <div />
          <Field label="PIN">
            <input className="input" type="password" value={form.pin} onChange={set('pin')} placeholder="SIM PIN" autoComplete="new-password" />
          </Field>
          <Field label="PUK">
            <input className="input" type="password" value={form.puk} onChange={set('puk')} placeholder="SIM PUK" autoComplete="new-password" />
          </Field>
        </div>
      )}
    </Modal>
  );
}
