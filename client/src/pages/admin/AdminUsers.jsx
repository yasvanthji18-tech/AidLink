import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, UserCheck, UserX, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerificationBadge, PointsBadge } from '../../components/Badges';

const roleColors = { donor: '#6366f1', volunteer: '#10b981', service_center: '#f59e0b', admin: '#ef4444' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [verifyingId, setVerifyingId] = useState(null);

  useEffect(() => {
    api.get('/admin/users').then(r => { setUsers(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleUser = async (id) => {
    try {
      const res = await api.patch(`/admin/users/${id}/toggle`);
      setUsers(prev => prev.map(u => u._id === id ? res.data : u));
      toast.success('User status updated');
    } catch { toast.error('Failed to update user'); }
  };

  const cycleVerification = async (id, current) => {
    const next = { unverified: 'verified', verified: 'trusted', trusted: 'unverified' };
    setVerifyingId(id);
    try {
      const res = await api.patch(`/admin/users/${id}/verify`, { verificationStatus: next[current] || 'verified' });
      setUsers(prev => prev.map(u => u._id === id ? res.data : u));
      toast.success(`Verification → ${next[current] || 'verified'}`);
    } catch { toast.error('Failed to verify user'); }
    finally { setVerifyingId(null); }
  };

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <Layout title="User Management">
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{users.length} registered users</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'donor', 'volunteer', 'service_center', 'admin'].map(r => (
            <button key={r} className={`btn btn-sm ${roleFilter === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRoleFilter(r)}>
              {r === 'all' ? 'All' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Verification</th>
                <th>Points</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 34, height: 34, background: `${roleColors[u.role]}20`, border: `1px solid ${roleColors[u.role]}40`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: roleColors[u.role], flexShrink: 0 }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: roleColors[u.role], textTransform: 'capitalize', background: `${roleColors[u.role]}15`, padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {u.role?.replace('_', ' ')}
                    </span>
                  </td>
                  <td><VerificationBadge status={u.verificationStatus || 'unverified'} /></td>
                  <td>
                    {u.role === 'volunteer'
                      ? <PointsBadge points={u.volunteerPoints || 0} />
                      : <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>—</span>
                    }
                  </td>
                  <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-delivered' : 'badge-expired'}`}>
                      {u.isActive ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {/* Verify cycle button (volunteers + donors) */}
                      {['volunteer', 'donor'].includes(u.role) && (
                        <button
                          className="btn btn-sm btn-outline"
                          style={{ padding: '0.3rem 0.6rem', gap: '0.3rem', fontSize: '0.75rem' }}
                          disabled={verifyingId === u._id}
                          onClick={() => cycleVerification(u._id, u.verificationStatus || 'unverified')}
                          title={`Current: ${u.verificationStatus || 'unverified'} — click to advance`}
                        >
                          <ShieldCheck size={13} />
                          {verifyingId === u._id ? '...' : 'Verify'}
                        </button>
                      )}
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        style={{ padding: '0.3rem 0.75rem' }}
                        onClick={() => toggleUser(u._id)}
                      >
                        {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                        {u.isActive ? ' Deactivate' : ' Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
