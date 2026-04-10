import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge, TypeBadge, DemandBadge, VerificationBadge } from '../components/Badges';
import { MapPin, Clock, Package, Truck, Building2, ArrowLeft, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STEP_ICONS = { posted: '📢', accepted: '🤝', collected: '📦', delivered: '📍', delivered_to_center: '📍', received: '✅', received_by_center: '✅', expired: '⏰', cancelled: '❌', escalated: '📣' };

function StatusTimeline({ timeline, currentStatus }) {
  if (!timeline || timeline.length === 0) {
    // Fallback: synthesize from currentStatus
    return (
      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No timeline data yet.</div>
    );
  }
  return (
    <div className="timeline">
      {timeline.map((entry, i) => {
        const isLast = i === timeline.length - 1;
        return (
          <div key={i} className="timeline-item">
            <div className={`timeline-dot ${isLast ? 'active' : 'done'}`}>
              {isLast ? (STEP_ICONS[entry.status] || '●') : '✓'}
            </div>
            <div className="timeline-body">
              <div className="timeline-label">{entry.status?.replace(/_/g, ' ')}</div>
              {entry.at && (
                <div className="timeline-time">
                  {format(new Date(entry.at), 'dd MMM yyyy, hh:mm a')}
                  {' · '}
                  {formatDistanceToNow(new Date(entry.at), { addSuffix: true })}
                </div>
              )}
              {entry.note && <div className="timeline-note">{entry.note}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function DonationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/donations/${id}`)
      .then(r => { setDonation(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const switchDeliveryMode = async (mode) => {
    try {
      const res = await api.patch(`/donations/${id}/delivery-mode`, { deliveryMode: mode });
      setDonation(d => ({ ...d, deliveryMode: res.data.deliveryMode, escalationStatus: res.data.escalationStatus }));
      toast.success(`Delivery mode switched to ${mode.replace(/_/g, ' ')}`);
    } catch {
      toast.error('Failed to update delivery mode');
    }
  };

  const handleRetry = async () => {
    try {
      const res = await api.patch(`/donations/${id}/retry`);
      setDonation(res.data);
      toast.success('Retry triggered: Seeking new center...');
    } catch { toast.error('Failed to retry matching'); }
  };

  const handleSelfDrop = async () => {
    try {
      await api.patch(`/donations/${id}/delivery-mode`, { deliveryMode: 'self_drop' });
      // Reload or update state
      const res = await api.get(`/donations/${id}`);
      setDonation(res.data);
      toast.success('Switched to Self-Drop mode. Please deliver to center.');
    } catch { toast.error('Failed to switch delivery mode'); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this donation?')) return;
    try {
      const res = await api.patch(`/donations/${id}/cancel`);
      setDonation(res.data);
      toast.success('Donation cancelled.');
    } catch { toast.error('Failed to cancel donation'); }
  };

  if (loading) return <Layout title="Donation Detail"><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (!donation) return <Layout title="Donation Detail"><div className="alert alert-error">Donation not found</div></Layout>;

  const demandConfig = {
    high:   { label: '🔥 High Demand Area',   cls: 'demand-high' },
    medium: { label: '⚡ Medium Demand Area', cls: 'demand-medium' },
    low:    { label: '💤 Low Demand',         cls: 'demand-low' },
    none:   { label: '⭕ No Demand Nearby',   cls: 'demand-none' },
  };
  const demand = demandConfig[donation.demandLevel] || demandConfig.medium;

  return (
    <Layout title="Donation Detail">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main info */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            {/* Badges row */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <TypeBadge type={donation.type} />
              <StatusBadge status={donation.status} />
              {donation.deliveryMode && (
                <span className="chip">
                  {donation.deliveryMode === 'volunteer_pickup' ? <Truck size={11} /> : <Building2 size={11} />}
                  {donation.deliveryMode.replace(/_/g, ' ')}
                </span>
              )}
              <span className={`demand-indicator ${demand.cls}`}>{demand.label}</span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{donation.title}</h1>
            {donation.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '1rem' }}>{donation.description}</p>
            )}

            {/* Escalation alert */}
            {donation?.escalationStatus && donation.escalationStatus !== 'none' && (
              <div className="escalation-panel" style={{ marginBottom: '1rem' }}>
                <div className="escalation-icon">⚠️</div>
                <div>
                  <div className="escalation-title">
                    {donation.escalationStatus === 'no_volunteers'
                      ? 'No volunteers available'
                      : 'Escalated to Service Centers'}
                  </div>
                  <div className="escalation-desc">
                    {donation.escalationStatus === 'no_volunteers'
                      ? 'Consider self-drop at a nearby center or contact one directly.'
                      : 'Nearby service centers have been notified about this donation.'}
                  </div>
                  {donation.escalationStatus === 'no_volunteers' && user?._id === (donation.donorId?._id || donation.donorId) && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => switchDeliveryMode('self_drop')}>
                        Change to Self Drop
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => switchDeliveryMode('service_center_pickup')}>
                        Change to Center Pickup
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Scheduled time */}
            {donation.isScheduled && donation.scheduledTime && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                <Calendar size={15} color="var(--primary-light)" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>SCHEDULED FOR</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{format(new Date(donation.scheduledTime), 'PPPp')}</div>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {donation.quantity && (
                <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>Quantity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}><Package size={14} /> {donation.quantity}</div>
                </div>
              )}
              {donation.location?.address && (
                <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>Location</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem' }}>
                    <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                    {donation.location.address}
                    {donation.location.city && `, ${donation.location.city}`}
                  </div>
                </div>
              )}
              {donation.expiryTime && (
                <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>Expires</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem', color: new Date(donation.expiryTime) < new Date() ? 'var(--danger)' : 'inherit' }}>
                    <Clock size={14} /> {format(new Date(donation.expiryTime), 'PPp')}
                  </div>
                </div>
              )}
              {donation.condition && (
                <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>Condition</div>
                  <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{donation.condition}</div>
                </div>
              )}
            </div>

            {donation.notes && (
              <div style={{ marginBottom: '1.5rem', padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 700, textTransform: 'uppercase' }}>Notes</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{donation.notes}</div>
              </div>
            )}

            {/* Delivery Proof */}
            {donation.deliveryProof && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Delivery Proof</div>
                <div className="proof-block">
                  <div className="proof-placeholder">📸</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>✓ Proof Submitted</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{donation.deliveryProof}</div>
                    {donation.deliveredAt && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Delivered at {format(new Date(donation.deliveredAt), 'PPp')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
                Donation Journey
              </div>
              <StatusTimeline timeline={donation.statusTimeline} currentStatus={donation.status} />
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '1rem' }}>
              Posted {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Donor */}
          {donation.donorId && (
            <div className="card">
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Donor</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="user-avatar">{donation.donorId.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{donation.donorId.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{donation.donorId.email}</div>
                  {donation.donorId.phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📞 {donation.donorId.phone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Volunteer */}
          {donation.assignedVolunteerId && (
            <div className="card">
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Assigned Volunteer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div className="user-avatar" style={{ background: 'var(--gradient-secondary)' }}>
                  {donation.assignedVolunteerId.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{donation.assignedVolunteerId.name}</div>
                  {donation.assignedVolunteerId.phone && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📞 {donation.assignedVolunteerId.phone}</div>
                  )}
                </div>
              </div>
              {donation.assignedVolunteerId.verificationStatus && (
                <VerificationBadge status={donation.assignedVolunteerId.verificationStatus} />
              )}
            </div>
          )}

          {/* Center */}
          {donation.assignedCenterId && (
            <div className="card">
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Service Center</div>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{donation.assignedCenterId.name}</div>
              {donation.assignedCenterId.location?.address && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.3rem', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                  <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                  {donation.assignedCenterId.location.address}
                  {donation.assignedCenterId.location.city && `, ${donation.assignedCenterId.location.city}`}
                </div>
              )}
              {(donation.assignedCenterId.contact?.contactNumber || donation.assignedCenterId.contact?.phone) && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  📞 {donation.assignedCenterId.contact.contactNumber || donation.assignedCenterId.contact.phone}
                </div>
              )}
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge ${donation.centerStatus === 'accepted' ? 'badge-success' : donation.centerStatus === 'rejected_by_all' || donation.centerStatus === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                  Center Response: {donation.centerStatus === 'rejected_by_all' ? 'Rejected by all centers' : donation.centerStatus || 'pending'}
                </span>
              </div>
            </div>
          )}

          {donation?.centerStatus === 'rejected_by_all' && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              <div style={{ marginBottom: '0.8rem', fontWeight: 600 }}>❌ No service center is available to accept this {donation.type} donation.</div>
              {user?.role === 'donor' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleRetry()}>Try Re-matching</button>
                  <button className="btn btn-sm btn-outline" onClick={() => handleSelfDrop()}>Deliver Myself (Self-Drop)</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleCancel()}>Cancel Donation</button>
                </div>
              )}
            </div>
          )}

          {/* Demand / Area card */}
          <div className="card">
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Area Demand</div>
            <DemandBadge level={donation.demandLevel || 'medium'} />
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {donation.demandLevel === 'high' && 'This area has high food demand — your donation is critical!'}
              {donation.demandLevel === 'medium' && 'Moderate demand in this area.'}
              {donation.demandLevel === 'low' && 'Low demand. Consider a high-demand area if possible.'}
              {donation.demandLevel === 'none' && 'No active demand detected nearby.'}
              {!donation.demandLevel && 'Demand data unavailable.'}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
