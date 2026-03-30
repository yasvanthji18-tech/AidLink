import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Building2, Package, Inbox, ClipboardList, ArrowRight } from 'lucide-react';
import { VerifiedBadge } from '../../components/Badges';

export default function CenterDashboard() {
  const { user } = useAuth();
  const [center, setCenter] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.serviceCenterId) { setLoading(false); return; }
    const cid = user.serviceCenterId?._id || user.serviceCenterId;
    Promise.all([
      api.get(`/centers/${cid}`),
      api.get(`/centers/${cid}/donations`),
    ]).then(([c, d]) => {
      setCenter(c.data);
      setDonations(d.data);
    }).finally(() => setLoading(false));
  }, [user]);

  const pending = donations.filter(d => d.status === 'posted');
  const received = donations.filter(d => ['delivered', 'received'].includes(d.status));

  return (
    <Layout title="Service Center Dashboard">
      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : !center ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <div className="empty-title">Center not linked</div>
          <div className="empty-text">Your account is not linked to a service center yet.</div>
        </div>
      ) : (
        <>
          <div className="page-header">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="page-title">{center.name}</h1>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{center.type?.replace(/_/g, ' ')}</span>
                  <VerifiedBadge verified={center.verified} />
                  {!center.verified && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>— Awaiting admin verification</span>}
                </div>
              </div>
            </div>
          </div>

          {!center.verified && (
            <div className="alert alert-warning" style={{ marginBottom: '1.5rem' }}>
              ⏳ Your center is pending verification by an admin. You'll receive full access once verified.
            </div>
          )}

          <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-icon"><Inbox size={22} color="var(--primary-light)" /></div>
              <div>
                <div className="stat-value">{pending.length}</div>
                <div className="stat-label">Pending Donations</div>
              </div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon green"><Package size={22} color="var(--secondary)" /></div>
              <div>
                <div className="stat-value">{received.length}</div>
                <div className="stat-label">Received</div>
              </div>
            </div>
            <div className="stat-card amber">
              <div className="stat-icon amber"><ClipboardList size={22} color="var(--accent)" /></div>
              <div>
                <div className="stat-value">{center.needs?.length || 0}</div>
                <div className="stat-label">Active Needs</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))' }}>
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>Manage Needs</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Define what your center currently needs.</p>
              <Link to="/center/needs" className="btn btn-primary">Manage Needs <ArrowRight size={15} /></Link>
            </div>
            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))' }}>
              <div className="card-title" style={{ marginBottom: '0.5rem' }}>Incoming Donations</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{donations.length} total donations for your center.</p>
              <Link to="/center/donations" className="btn btn-secondary">View Donations <ArrowRight size={15} /></Link>
            </div>
          </div>

          {/* Center info */}
          {center.description && (
            <div className="card" style={{ marginTop: '1.5rem' }}>
              <div className="card-title" style={{ marginBottom: '0.75rem' }}>About Your Center</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.7' }}>{center.description}</p>
              {center.location?.city && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                  📍 {center.location.address}{center.location.city ? `, ${center.location.city}` : ''}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
