import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import DonationCard from '../../components/DonationCard';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search } from 'lucide-react';

export default function AvailablePickups() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchDonations = () => {
    setLoading(true);
    api.get('/donations').then(r => { setDonations(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleAccept = async (donation) => {
    setAccepting(donation._id);
    try {
      await api.post('/tasks/accept', { donationId: donation._id });
      toast.success('Task accepted! Head to the pickup location. 🚚');
      fetchDonations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not accept task');
    } finally {
      setAccepting(null);
    }
  };

  const filtered = donations.filter(d => {
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || (d.location?.city || '').toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <Layout title="Available Pickups">
      <div className="page-header">
        <h1 className="page-title">Available Pickups</h1>
        <p className="page-subtitle">Browse donations that need volunteer pickup</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} />
          <input placeholder="Search by title or city..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'food', 'item'].map(t => (
            <button key={t} className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTypeFilter(t)}>
              {t === 'all' ? '📋 All' : t === 'food' ? '🍱 Food' : '📦 Items'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <div className="empty-title">No pickups available</div>
          <div className="empty-text">All donations have been claimed. Check back soon!</div>
        </div>
      ) : (
        <div className="grid grid-auto">
          {filtered.map(d => (
            <DonationCard
              key={d._id}
              donation={d}
              actionLabel={accepting === d._id ? 'Accepting...' : '🚚 Accept Pickup'}
              onAction={d.status === 'posted' ? handleAccept : undefined}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
