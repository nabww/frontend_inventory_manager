import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { deviceApi } from '../api';
import { AppShell } from '../components/layout';
import { PageLoader, StatusBadge } from '../components/common';
import { RiTabletLine, RiSimCard2Line, RiWifiLine, RiAlertLine,
         RiShieldCheckLine, RiArrowRightLine, RiToolsLine } from 'react-icons/ri';
import { format, formatDistanceToNow } from 'date-fns';

const Stat = ({ icon, cls, label, value, sub }) => (
  <div className="stat">
    <div className={`stat-icon ${cls}`}>{icon}</div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-val">{value ?? 0}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

export default function DashboardPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    deviceApi.dashboard()
      .then(r => setStats(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell title="Dashboard"><PageLoader /></AppShell>;

  return (
    <AppShell title="Dashboard">
      <div className="page-hd">
        <div><h1>Overview</h1><p>EMR device inventory summary</p></div>
        <div className="hd-actions">
          <button className="btn btn-primary" onClick={() => navigate('/devices')}>
            All Devices <RiArrowRightLine size={13}/>
          </button>
        </div>
      </div>

      <div className="grid g4 mb-22">
        <Stat icon={<RiTabletLine />}       cls="ic-purple" label="Total Devices"   value={stats?.total_devices}   sub="All registered" />
        <Stat icon={<RiSimCard2Line />}      cls="ic-blue"   label="With SIM"        value={stats?.devices_with_sim} sub="SIM paired" />
        <Stat icon={<RiWifiLine />}          cls="ic-green"  label="WiFi Only"       value={stats?.wifi_only}        sub="No SIM card" />
        <Stat icon={<RiAlertLine />}         cls="ic-red"    label="Cover Issues"    value={stats?.cover_issues}    sub="Needs attention" />
      </div>

      <div className="grid g2 mb-22">
        {/* Unverified this year */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">⚠️ Not Yet Verified ({new Date().getFullYear()})</span>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/verify')}>Verify</button>
          </div>
          {!stats?.unverified_this_year?.length ? (
            <div className="empty" style={{padding:'30px 20px'}}>
              <div className="empty-icon">✅</div>
              <div className="empty-title">All active devices verified!</div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table>
                <thead><tr><th>Serial</th><th>Model</th><th>Facility</th></tr></thead>
                <tbody>
                  {stats.unverified_this_year.map(d => (
                    <tr key={d.id} style={{cursor:'pointer'}} onClick={() => navigate(`/devices/${d.id}`)}>
                      <td className="fw6">{d.serial_number}</td>
                      <td className="td-dim">{d.model || '—'}</td>
                      <td className="td-dim">{d.facility} <span style={{opacity:.6}}>({d.mfl_code})</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent verifications */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">Recent Verifications</span>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/verify')}>View all</button>
          </div>
          {!stats?.recent_verifications?.length ? (
            <div className="empty" style={{padding:'30px 20px'}}>
              <div className="empty-icon"><RiShieldCheckLine /></div>
              <div className="empty-title">No verifications yet</div>
            </div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table>
                <thead><tr><th>Serial</th><th>Status</th><th>By</th><th>When</th></tr></thead>
                <tbody>
                  {stats.recent_verifications.map(v => (
                    <tr key={v.id} style={{cursor:'pointer'}} onClick={() => navigate(`/devices/${v.device_id}`)}>
                      <td className="fw6">{v.serial_number}</td>
                      <td><StatusBadge status={v.overall_status} /></td>
                      <td className="td-dim">{v.verified_by_name}</td>
                      <td className="td-dim">{formatDistanceToNow(new Date(v.verified_at), {addSuffix:true})}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
