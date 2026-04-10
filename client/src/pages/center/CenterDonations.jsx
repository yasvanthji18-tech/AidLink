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
  const [activeType, setActiveType] = useState('all'); // Added for food/items filtering

  const centerId = user?.serviceCenterId?._id || user?.serviceCenterId;

  const fetchDonations = () => {
    if (!centerId) { setLoading(false); return; }
    api.get(`/centers/${centerId}/donations`).then(r => { setDonations(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchDonations(); }, [centerId]); // eslint-disable-next-line react-hooks/exhaustive-deps

  const markReceived = async (donationId) => {
    try {
      await api.patch(`/donations/${donationId}/status`, { status: 'received_by_center' });
      toast.success('Marked as received ✅');
      fetchDonations();
    } catch { toast.error('Failed to update status'); }
  };

  const handleRespond = async (donationId, action) => {
    try {
      await api.patch(`/centers/${centerId}/respond-donation`, { donationId, action });
      toast.success(action === 'accept' ? 'Donation accepted ✅' : 'Donation rejected ❌');
      fetchDonations();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
  };

  const handlePickupRespond = async (donationId, action) => {
    try {
      await api.patch(`/centers/${centerId}/respond-pickup`, { donationId, action });
      toast.success(action === 'confirm' ? 'Pickup confirmed ✅' : 'Pickup declined ❌');
      fetchDonations();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update pickup status'); }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Requests' },
    { key: 'incoming', label: 'Incoming' },
    { key: 'received', label: 'Received' },
  ];

  const filtered = donations.filter(d => {
    // Stage filters
    let matchStage = true;
    if (activeTab === 'pending') matchStage = d.centerStatus === 'pending';
    else if (activeTab === 'incoming') matchStage = d.centerStatus === 'accepted' && ['posted', 'accepted', 'assigned', 'collected', 'delivered_to_center'].includes(d.status);
    else if (activeTab === 'received') matchStage = ['received', 'received_by_center'].includes(d.status);

    // Type filters
    let matchType = true;
    if (activeType !== 'all') matchType = d.type === activeType;

    return matchStage && matchType;
  });

  return (
    <Layout title="Incoming Donations">
      <div className="page-header">
        <h1 className="page-title">Incoming Donations</h1>
        <p className="page-subtitle">Track donations coming to your center</p>
      </div>

      <div className="tabs" style={{ marginBottom: '1rem' }}>
        {tabs.map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'food', 'item'].map(t => (
          <button 
            key={t} 
            className={`btn btn-sm ${activeType === t ? 'btn-primary' : 'btn-outline'}`} 
            onClick={() => setActiveType(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'all' ? '🍴 All Categories' : t}
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
                <th>Global Status</th>
                <th>Center Status</th>
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
                  <td>
                    <span className={`badge ${d.centerStatus === 'accepted' ? 'badge-success' : d.centerStatus === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                      {d.centerStatus || 'pending'}
                    </span>
                  </td>
                  <td><span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {d.centerStatus === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleRespond(d._id, 'accept')}>Accept</button>
                          <button className="btn btn-outline btn-sm" onClick={() => handleRespond(d._id, 'reject')}>Reject</button>
                        </div>
                      )}
                      
                      {d.centerStatus === 'accepted' && d.centerPickupRequested && d.centerPickupResponse === 'none' && (
                        <div className="alert alert-warning" style={{ padding: '0.5rem', margin: 0, fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <span>⚠️ Pickup Requested</span>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handlePickupRespond(d._id, 'confirm')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Confirm Pickup</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handlePickupRespond(d._id, 'decline')} style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}>Decline</button>
                          </div>
                        </div>
                      )}

                      {d.centerStatus === 'accepted' && (d.status === 'delivered_to_center' || d.status === 'center_picked' || (d.deliveryMode !== 'volunteer_pickup' && !['received', 'received_by_center'].includes(d.status))) && (
                        <button className="btn btn-primary btn-sm" onClick={() => markReceived(d._id)}>✓ Mark Received</button>
                      )}
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
