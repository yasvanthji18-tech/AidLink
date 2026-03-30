import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DonationCard from '../../components/DonationCard';
import api from '../../services/api';
import { Search, Filter } from 'lucide-react';

export default function MyDonations() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/donations').then(r => { setDonations(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'expired', label: 'Expired' },
  ];

  const filtered = donations.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) || d.type.includes(search);
    const matchTab = activeTab === 'all' ? true
      : activeTab === 'active' ? ['posted', 'accepted', 'collected'].includes(d.status)
      : activeTab === 'delivered' ? ['delivered', 'received'].includes(d.status)
      : d.status === 'expired';
    return matchSearch && matchTab;
  });

  return (
    <Layout title="My Donations">
      <div className="page-header">
        <h1 className="page-title">My Donations</h1>
        <p className="page-subtitle">Track all your donations and their current status</p>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: '200px' }}>
          <Search size={16} />
          <input placeholder="Search donations..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'var(--bg-elevated)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
              {t.key === 'all' ? donations.length
                : t.key === 'active' ? donations.filter(d => ['posted','accepted','collected'].includes(d.status)).length
                : t.key === 'delivered' ? donations.filter(d => ['delivered','received'].includes(d.status)).length
                : donations.filter(d => d.status === 'expired').length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">No donations found</div>
          <div className="empty-text">Try adjusting your filter or create a new donation.</div>
        </div>
      ) : (
        <div className="grid grid-auto">
          {filtered.map(d => (
            <DonationCard key={d._id} donation={d} onClick={() => navigate(`/donations/${d._id}`)} />
          ))}
        </div>
      )}
    </Layout>
  );
}
