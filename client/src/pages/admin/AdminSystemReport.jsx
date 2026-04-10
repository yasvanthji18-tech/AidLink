import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { format } from 'date-fns';
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

function MetricCard({ label, value, sub, color = 'var(--primary)', icon }) {
  return (
    <div className="stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="stat-icon" style={{ background: `${color}15` }}>
        {icon || <span style={{ fontSize: '1.2rem' }}>📊</span>}
      </div>
      <div>
        <div className="stat-value" style={{ color }}>{value ?? '—'}</div>
        <div className="stat-label">{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{sub}</div>}
      </div>
    </div>
  );
}

function IssueRow({ icon, label, count, severity }) {
  const colors = { ok: 'var(--secondary)', warn: 'var(--accent)', error: 'var(--danger)' };
  const color = count > 0 ? colors[severity] || colors.warn : colors.ok;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}>
        {count === 0
          ? <CheckCircle size={16} color="var(--secondary)" />
          : severity === 'error'
            ? <XCircle size={16} color="var(--danger)" />
            : <AlertTriangle size={16} color="var(--accent)" />}
        {label}
      </div>
      <span className={`badge ${count === 0 ? 'badge-success' : severity === 'error' ? 'badge-danger' : 'badge-warning'}`}
        style={{ fontWeight: 700, minWidth: '36px', textAlign: 'center' }}>
        {count}
      </span>
    </div>
  );
}

export default function AdminSystemReport() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReport = () => {
    setLoading(true);
    setError(null);
    api.get('/admin/system-report')
      .then(r => { setReport(r.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load report'); setLoading(false); });
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return <Layout title="System Report"><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (error) return <Layout title="System Report"><div className="alert alert-error">{error}</div></Layout>;
  if (!report) return null;

  const { serviceCenters, volunteers, donations, issues, generatedAt } = report;
  const completionRate = donations.total > 0 ? Math.round((donations.completed / donations.total) * 100) : 0;

  return (
    <Layout title="System Report">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">System Health Report</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Generated at {generatedAt ? format(new Date(generatedAt), 'dd MMM yyyy, hh:mm a') : '—'}
          </p>
        </div>
        <button className="btn btn-outline" onClick={fetchReport} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Completion banner */}
      <div style={{
        padding: '1rem 1.5rem',
        borderRadius: 'var(--radius)',
        background: completionRate >= 70 ? 'rgba(16,185,129,0.1)' : completionRate >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${completionRate >= 70 ? 'rgba(16,185,129,0.3)' : completionRate >= 40 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <span style={{ fontSize: '2rem' }}>
          {completionRate >= 70 ? '✅' : completionRate >= 40 ? '⚡' : '⚠️'}
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {completionRate}% donation completion rate
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {donations.completed} completed · {donations.pending} pending · {donations.cancelled} cancelled
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <div style={{ height: '8px', width: '160px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: `${completionRate}%`, height: '100%', background: completionRate >= 70 ? 'var(--secondary)' : completionRate >= 40 ? 'var(--accent)' : 'var(--danger)', borderRadius: '4px', transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <MetricCard label="Total Service Centers" value={serviceCenters.total} sub={`${serviceCenters.verified} verified · ${serviceCenters.unverified} unverified`} color="var(--primary)" />
        <MetricCard label="Total Volunteers" value={volunteers.total} color="var(--secondary)" />
        <MetricCard label="Total Donations" value={donations.total} sub={`${donations.unassigned} unassigned`} color="var(--accent)" />
        <MetricCard label="Completed Donations" value={donations.completed} sub={`${completionRate}% completion`} color="var(--secondary)" />
      </div>

      {/* Issues panel */}
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔍 Issue Checklist</div>
            <span className={`badge ${issues.failedFlows + issues.stalePendingVolunteer + issues.missingVolunteerLongWait + issues.centersWithNoNeeds === 0 ? 'badge-success' : 'badge-danger'}`}>
              {issues.failedFlows + issues.stalePendingVolunteer + issues.missingVolunteerLongWait + issues.centersWithNoNeeds === 0 ? 'All Clear' : 'Issues Found'}
            </span>
          </div>
          <IssueRow label="Donations rejected by all centers" count={issues.failedFlows} severity="error" />
          <IssueRow label="Stale waiting-for-volunteer (> 30 min)" count={issues.stalePendingVolunteer} severity="warn" />
          <IssueRow label="No volunteer assigned (> 1 hour)" count={issues.missingVolunteerLongWait} severity="warn" />
          <IssueRow label="Unassigned donations (no center)" count={donations.unassigned} severity="error" />
          <IssueRow label="Service centers with no needs listed" count={issues.centersWithNoNeeds} severity="warn" />
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">📊 Donation Status Breakdown</div>
          </div>
          <div className="report-grid" style={{ gap: '0.6rem' }}>
            {[
              { label: 'Completed / Received', value: donations.completed, color: 'var(--secondary)' },
              { label: 'Pending / In-Progress', value: donations.pending, color: 'var(--accent)' },
              { label: 'Cancelled', value: donations.cancelled, color: 'var(--danger)' },
              { label: 'Unassigned', value: donations.unassigned, color: 'var(--text-muted)' },
            ].map(({ label, value, color }) => (
              <div key={label} className="report-item">
                <span className="report-label">{label}:</span>
                <span className="report-value" style={{ color, fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
              <span>Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div style={{ height: '8px', background: 'var(--bg-elevated)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${completionRate}%`, height: '100%', background: 'var(--secondary)', borderRadius: '4px', transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Failed flows detail */}
      {issues.failedFlowDetails && issues.failedFlowDetails.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><XCircle size={16} style={{ marginRight: '0.4rem', display: 'inline', color: 'var(--danger)' }} />Failed Flows — Rejected by All Centers</div>
            <span className="badge badge-danger">{issues.failedFlowDetails.length}</span>
          </div>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Donation</th>
                  <th>Type</th>
                  <th>City</th>
                  <th>Current Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {issues.failedFlowDetails.map(d => (
                  <tr key={d._id}>
                    <td style={{ fontWeight: 600 }}>{d.title}</td>
                    <td><span className={`badge badge-${d.type}`}>{d.type}</span></td>
                    <td>{d.location?.city || '—'}</td>
                    <td><span className="badge badge-danger">{d.status}</span></td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.createdAt ? format(new Date(d.createdAt), 'dd MMM, hh:mm a') : '—'}</td>
                    <td>
                      <a href={`/donations/${d._id}`} className="btn btn-sm btn-outline">View</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issues.failedFlowDetails?.length === 0 && issues.stalePendingVolunteer === 0 && issues.missingVolunteerLongWait === 0 && donations.unassigned === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>System is Healthy!</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No failed flows, no stale donations, no unassigned items detected.</div>
        </div>
      )}
    </Layout>
  );
}
