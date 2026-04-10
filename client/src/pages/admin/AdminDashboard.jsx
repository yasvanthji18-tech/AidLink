import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Users, Package, Building2, DollarSign, Trophy, ShieldCheck } from 'lucide-react';
import { VerificationBadge, PointsBadge } from '../../components/Badges';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchStats = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/leaderboard'),
    ])
      .then(([s, l]) => { setStats(s.data); setLeaders(l.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleToggleTestMode = async () => {
    try {
      setToggling(true);
      await api.patch('/admin/settings/toggle-test-mode');
      fetchStats();
    } catch (err) {
      alert('Failed to toggle test mode: ' + err.message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Layout title="Admin Dashboard"><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (!stats) return <Layout title="Admin Dashboard"><div className="alert alert-error">Failed to load stats</div></Layout>;

  const typeMap = stats.donationsByType?.reduce((a, d) => ({ ...a, [d._id]: d.count }), {}) || {};
  const statusMap = stats.donationsByStatus?.reduce((a, d) => ({ ...a, [d._id]: d.count }), {}) || {};
  const roleMap = stats.usersByRole?.reduce((a, d) => ({ ...a, [d._id]: d.count }), {}) || {};

  return (
    <Layout title="Admin Dashboard">
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className={`badge ${stats.testMode ? 'badge-warning' : 'badge-success'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 600 }}>
            {stats.testMode ? '⚠️ TEST MODE ACTIVE' : '✅ LIVE MODE'}
          </div>
          <button 
            className="btn btn-outline" 
            onClick={async () => {
              try {
                const res = await api.get('/donations/trigger-fallbacks');
                alert(`Processed ${res.count} fallbacks!`);
                fetchStats();
              } catch (err) { alert('Failed to trigger fallbacks'); }
            }}
            disabled={toggling}
            style={{ minWidth: '160px', marginLeft: '0.5rem' }}
          >
            Process Fallbacks
          </button>
          <button 
            className={`btn ${stats.testMode ? 'btn-outline' : 'btn-primary'}`} 
            onClick={handleToggleTestMode}
            disabled={toggling}
            style={{ minWidth: '160px', marginLeft: '0.5rem' }}
          >
            {toggling ? 'Updating...' : stats.testMode ? 'Switch to Live' : 'Enable Test Mode'}
          </button>
        </div>
      </div>
      <p className="page-subtitle" style={{ marginBottom: '2rem' }}>
        {stats.testMode 
          ? 'System is currently restricted to 3 selected service centers for testing.' 
          : 'Monitor and manage the entire AidLink platform.'}
      </p>

      {/* Top stats */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Users size={22} color="var(--primary-light)" /></div>
          <div>
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><Package size={22} color="var(--secondary)" /></div>
          <div>
            <div className="stat-value">{stats.totalDonations}</div>
            <div className="stat-label">Total Donations</div>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Building2 size={22} color="var(--accent)" /></div>
          <div>
            <div className="stat-value">{stats.verifiedCenters}/{stats.totalCenters}</div>
            <div className="stat-label">Verified Centers</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={22} color="var(--primary-light)" /></div>
          <div>
            <div className="stat-value">₹{(stats.totalFundingAmount || 0).toLocaleString('en-IN')}</div>
            <div className="stat-label">Funds Raised (Simulated)</div>
          </div>
        </div>
      </div>

      {/* Charts (text-based breakdown) */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {/* Users by role */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Users by Role</div>
          {[['donor','Donors','#6366f1'], ['volunteer','Volunteers','#10b981'], ['service_center','Service Centers','#f59e0b'], ['admin','Admins','#ef4444']].map(([key, label, color]) => {
            const count = roleMap[key] || 0;
            const pct = stats.totalUsers ? Math.round((count / stats.totalUsers) * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Donations by type */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Donations by Type</div>
          {[['food','Food 🍱','#f59e0b'], ['item','Items 📦','#3b82f6'], ['funding','Funding 💰','#10b981']].map(([key, label, color]) => {
            const count = typeMap[key] || 0;
            const pct = stats.totalDonations ? Math.round((count / stats.totalDonations) * 100) : 0;
            return (
              <div key={key} style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500 }}>{label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Donations by status */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '1rem' }}>Donation Status</div>
          {Object.entries(statusMap).map(([status, count]) => {
            const pct = stats.totalDonations ? Math.round((count / stats.totalDonations) * 100) : 0;
            return (
              <div key={status} style={{ marginBottom: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{status}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        {[
          { to: '/admin/users', label: 'Manage Users', icon: Users, count: stats.totalUsers, color: 'var(--primary)' },
          { to: '/admin/centers', label: 'Verify Centers', icon: Building2, count: `${stats.totalCenters - stats.verifiedCenters} pending`, color: 'var(--accent)' },
          { to: '/admin/donations', label: 'Monitor Donations', icon: Package, count: stats.totalDonations, color: 'var(--secondary)' },
        ].map(l => {
          const Icon = l.icon;
          return (
            <a key={l.to} href={l.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 44, height: 44, background: `${l.color}20`, border: `1px solid ${l.color}40`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: l.color }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{l.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{l.count}</div>
                  </div>
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Volunteer Leaderboard & System Summary */}
      <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
        {/* Volunteer Leaderboard */}
        {leaders.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Trophy size={16} style={{ marginRight: '0.4rem', display: 'inline' }} />Top Volunteers</div>
              <a href="/admin/users" style={{ textDecoration: 'none' }} className="btn btn-outline btn-sm">View All Users</a>
            </div>
            {leaders.map((l, i) => {
              const rankCls = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
              return (
                <div key={l._id} className="leaderboard-item">
                  <div className={`leaderboard-rank ${rankCls}`}>{i + 1}</div>
                  <div className="leaderboard-name">{l.name}</div>
                  <VerificationBadge status={l.verificationStatus || 'unverified'} />
                  <PointsBadge points={l.volunteerPoints || 0} />
                </div>
              );
            })}
          </div>
        )}

        {/* System Summary Report */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><ShieldCheck size={16} style={{ marginRight: '0.4rem', display: 'inline' }} />System Summary Report</div>
          </div>
          <div className="report-grid">
            <div className="report-item">
              <span className="report-label">Total Service Centers:</span>
              <span className="report-value">{stats.totalCenters}</span>
            </div>
            <div className="report-item">
              <span className="report-label">Active Test Centers:</span>
              <span className="report-value" style={{ color: stats.testMode ? 'var(--warning)' : 'inherit' }}>
                {stats.testMode ? stats.testCenters?.length : 'N/A'}
              </span>
            </div>
            <div className="report-item">
              <span className="report-label">Total Volunteers:</span>
              <span className="report-value">{stats.volunteers?.length || 0}</span>
            </div>
            <div className="report-item">
              <span className="report-label">Total Donations:</span>
              <span className="report-value">{stats.totalDonations}</span>
            </div>
            <div className="report-item">
              <span className="report-label">Completed Donations:</span>
              <span className="report-value" style={{ color: 'var(--secondary)' }}>{statusMap['received'] || 0}</span>
            </div>
            <div className="report-item">
              <span className="report-label">Pending Donations:</span>
              <span className="report-value" style={{ color: 'var(--accent)' }}>{stats.totalDonations - (statusMap['received'] || 0) - (statusMap['cancelled'] || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Centers Section */}
      {stats.testMode && stats.testCenters?.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--warning-light)' }}>
          <div className="card-header">
            <div className="card-title">Active Test Service Centers</div>
            <div className="badge badge-warning">LIMIT: 3 CENTERS</div>
          </div>
          <div className="grid grid-3">
            {stats.testCenters.map(center => (
              <div key={center._id} className="test-center-card">
                <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>{center.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>📍 {center.location?.city}, {center.location?.state}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📞 {center.contact}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {center.needs?.map((n, idx) => (
                    <span key={idx} className="badge badge-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--primary-light)', color: 'var(--primary)', fontSize: '0.7rem' }}>
                      {n.type}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Volunteer Visibility Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Volunteer Availability & Status</div>
          <div className="badge badge-success">{stats.volunteers?.length || 0} Active</div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Volunteer Name</th>
                <th>Location</th>
                <th>Rank/Points</th>
                <th>Active Tasks</th>
              </tr>
            </thead>
            <tbody>
              {stats.volunteers?.slice(0, 10).map(v => (
                <tr key={v._id}>
                  <td><div style={{ fontWeight: 600 }}>{v.name}</div></td>
                  <td>{v.location?.city || 'Not specified'}</td>
                  <td><PointsBadge points={v.volunteerPoints || 0} /></td>
                  <td>
                    <span className={`badge ${v.taskCount > 0 ? 'badge-primary' : 'badge-outline'}`}>
                      {v.taskCount || 0} tasks
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
