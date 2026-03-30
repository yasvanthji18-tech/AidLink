import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Users, Package, Building2, DollarSign, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setStats(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Admin Dashboard"><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (!stats) return <Layout title="Admin Dashboard"><div className="alert alert-error">Failed to load stats</div></Layout>;

  const typeMap = stats.donationsByType?.reduce((a, d) => ({ ...a, [d._id]: d.count }), {}) || {};
  const statusMap = stats.donationsByStatus?.reduce((a, d) => ({ ...a, [d._id]: d.count }), {}) || {};
  const roleMap = stats.usersByRole?.reduce((a, d) => ({ ...a, [d._id]: d.count }), {}) || {};

  return (
    <Layout title="Admin Dashboard">
      <div className="page-header">
        <h1 className="page-title">Platform Overview</h1>
        <p className="page-subtitle">Monitor and manage the entire AidLink platform</p>
      </div>

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
      <div className="grid grid-3">
        {[
          { to: '/admin/users', label: 'Manage Users', icon: Users, count: stats.totalUsers, color: 'var(--primary)' },
          { to: '/admin/centers', label: 'Verify Centers', icon: Building2, count: stats.totalCenters - stats.verifiedCenters + ' pending', color: 'var(--accent)' },
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
    </Layout>
  );
}
