import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { VerifiedBadge } from '../../components/Badges';
import { Search, ShieldCheck, ShieldX, MapPin } from 'lucide-react';

export default function AdminCenters() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/centers').then(r => { setCenters(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const toggleVerify = async (centerId, currentStatus) => {
    try {
      const res = await api.patch('/admin/verify-center', { centerId, verified: !currentStatus });
      setCenters(prev => prev.map(c => c._id === centerId ? res.data : c));
      toast.success(`Center ${!currentStatus ? 'verified' : 'unverified'}!`);
    } catch { toast.error('Failed to update center'); }
  };

  const filtered = centers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || (c.location?.city || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : filter === 'verified' ? c.verified : !c.verified;
    return matchSearch && matchFilter;
  });

  return (
    <Layout title="Service Centers">
      <div className="page-header">
        <h1 className="page-title">Service Centers</h1>
        <p className="page-subtitle">{centers.filter(c => !c.verified).length} pending verification</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} />
          <input placeholder="Search by name or city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'pending', 'verified'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏢</div>
          <div className="empty-title">No centers found</div>
        </div>
      ) : (
        <div className="grid grid-auto">
          {filtered.map(c => (
            <div key={c._id} className="card" style={{ borderTop: `3px solid ${c.verified ? 'var(--secondary)' : 'var(--accent)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{c.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{c.type?.replace(/_/g, ' ')}</div>
                </div>
                <VerifiedBadge verified={c.verified} />
              </div>

              {c.location?.address && (
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0 }} />
                  {c.location.address}{c.location.city ? `, ${c.location.city}` : ''}
                </div>
              )}

              {c.description && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.description}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {c.needs?.length || 0} needs listed • ₹{(c.totalDonationsReceived || 0).toLocaleString('en-IN')} received
                </div>
                <button
                  className={`btn btn-sm ${c.verified ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => toggleVerify(c._id, c.verified)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {c.verified ? <><ShieldX size={13} /> Unverify</> : <><ShieldCheck size={13} /> Verify</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
