import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { StatusBadge, TypeBadge } from '../../components/Badges';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/donations').then(r => { setDonations(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = donations.filter(d => {
    const matchSearch = d.title?.toLowerCase().includes(search.toLowerCase()) || d.donorId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <Layout title="All Donations">
      <div className="page-header">
        <h1 className="page-title">All Donations</h1>
        <p className="page-subtitle">{donations.length} total donations on the platform</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} />
          <input placeholder="Search by title or donor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'food', 'item', 'funding'].map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? 'All' : t === 'food' ? '🍱 Food' : t === 'item' ? '📦 Items' : '💰 Funding'}
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
                <th>Title</th>
                <th>Type</th>
                <th>Donor</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d._id} style={{ cursor: 'pointer' }}>
                  <td><span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{d.title}</span>{d.quantity && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.quantity}</div>}</td>
                  <td><TypeBadge type={d.type} /></td>
                  <td><span style={{ fontSize: '0.82rem' }}>{d.donorId?.name || '—'}</span></td>
                  <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{d.deliveryMode?.replace(/_/g,' ') || '—'}</span></td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {d.assignedVolunteerId?.name ? `👤 ${d.assignedVolunteerId.name}` : d.assignedCenterId?.name ? `🏢 ${d.assignedCenterId.name}` : '—'}
                    </span>
                  </td>
                  <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
