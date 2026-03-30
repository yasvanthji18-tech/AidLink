import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge, TypeBadge } from '../components/Badges';
import { MapPin, Clock, Package, User, Phone, Truck, Building2, ArrowLeft } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function DonationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/donations/${id}`).then(r => { setDonation(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const statusFlow = donation?.type === 'food'
    ? ['posted', 'accepted', 'collected', 'delivered', 'expired']
    : donation?.type === 'item'
    ? ['posted', 'accepted', 'delivered', 'received']
    : ['initiated', 'completed'];

  if (loading) return <Layout title="Donation Detail"><div className="loading-spinner"><div className="spinner" /></div></Layout>;
  if (!donation) return <Layout title="Donation Detail"><div className="alert alert-error">Donation not found</div></Layout>;

  const currentIdx = statusFlow.indexOf(donation.status);

  return (
    <Layout title="Donation Detail">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Main info */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <TypeBadge type={donation.type} />
              <StatusBadge status={donation.status} />
              {donation.deliveryMode && (
                <span className="chip">
                  {donation.deliveryMode === 'volunteer_pickup' ? <Truck size={11} /> : <Building2 size={11} />}
                  {donation.deliveryMode.replace(/_/g, ' ')}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{donation.title}</h1>
            {donation.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.7', marginBottom: '1rem' }}>{donation.description}</p>
            )}

            {/* Status flow */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Donation Journey</div>
              <div className="status-flow">
                {statusFlow.map((s, i) => (
                  <React.Fragment key={s}>
                    <div className={`status-step ${i === currentIdx ? 'active' : i < currentIdx ? 'done' : ''}`}>
                      {i < currentIdx ? '✓ ' : ''}{s}
                    </div>
                    {i < statusFlow.length - 1 && <span className="status-arrow">→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {donation.quantity && (
                <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>Quantity</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}><Package size={14} /> {donation.quantity}</div>
                </div>
              )}
              {donation.location?.address && (
                <div style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700 }}>Location</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontWeight: 600, fontSize: '0.82rem' }}><MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />{donation.location.address}</div>
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
              <div style={{ marginTop: '1rem', padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', fontWeight: 700, textTransform: 'uppercase' }}>Notes</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{donation.notes}</div>
              </div>
            )}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
            Posted {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Donor info */}
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

          {/* Volunteer info */}
          {donation.assignedVolunteerId && (
            <div className="card">
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Assigned Volunteer</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="user-avatar" style={{ background: 'var(--gradient-secondary)' }}>{donation.assignedVolunteerId.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ fontWeight: 700 }}>{donation.assignedVolunteerId.name}</div>
                  {donation.assignedVolunteerId.phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📞 {donation.assignedVolunteerId.phone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Center info */}
          {donation.assignedCenterId && (
            <div className="card">
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Service Center</div>
              <div style={{ fontWeight: 700, marginBottom: '0.3rem' }}>{donation.assignedCenterId.name}</div>
              {donation.assignedCenterId.location?.address && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.3rem', alignItems: 'flex-start' }}>
                  <MapPin size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
                  {donation.assignedCenterId.location.address}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
