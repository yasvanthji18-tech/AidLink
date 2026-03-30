import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatusBadge, TypeBadge } from '../../components/Badges';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

export default function CenterDonations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const centerId = user?.serviceCenterId?._id || user?.serviceCenterId;

  const fetchDonations = () => {
    if (!centerId) { setLoading(false); return; }
    api.get(`/centers/${centerId}/donations`).then(r => { setDonations(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchDonations(); }, [centerId]);

  const markReceived = async (donationId) => {
    try {
      await api.patch(`/donations/${donationId}/status`, { status: 'received' });
      toast.success('Marked as received ✅');
      fetchDonations();
    } catch { toast.error('Failed to update status'); }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'incoming', label: 'Incoming' },
    { key: 'received', label: 'Received' },
  ];

  const filtered = donations.filter(d => {
    if (activeTab === 'incoming') return ['posted', 'accepted', 'collected', 'delivered'].includes(d.status);
    if (activeTab === 'received') return d.status === 'received';
    return true;
  });

  return (
    <Layout title="Incoming Donations">
      <div className="page-header">
        <h1 className="page-title">Incoming Donations</h1>
        <p className="page-subtitle">Track donations coming to your center</p>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <div className="empty-title">No donations here</div>
          <div className="empty-text">Donations sent to your center will appear here.</div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Donation</th>
                <th>Type</th>
                <th>Donor</th>
                <th>Status</th>
                <th>Received</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</div>
                    {d.quantity && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{d.quantity}</div>}
                  </td>
                  <td><TypeBadge type={d.type} /></td>
                  <td><span style={{ fontSize: '0.82rem' }}>{d.donorId?.name || '—'}</span></td>
                  <td><StatusBadge status={d.status} /></td>
                  <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span></td>
                  <td>
                    {d.status === 'delivered' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => markReceived(d._id)}>
                        ✓ Confirm Receipt
                      </button>
                    )}
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
