import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Heart, PlusCircle, Package, Clock, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { TypeBadge, StatusBadge } from '../../components/Badges';
import { formatDistanceToNow } from 'date-fns';

export default function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/donations').then(r => { setDonations(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const stats = {
    total: donations.length,
    active: donations.filter(d => ['posted', 'accepted', 'collected'].includes(d.status)).length,
    delivered: donations.filter(d => ['delivered', 'received'].includes(d.status)).length,
    food: donations.filter(d => d.type === 'food').length,
  };

  return (
    <Layout title="Donor Dashboard">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="page-subtitle">Here's your donation activity overview</p>
      </div>

      {/* Quick Action */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--gradient-card)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.25rem' }}>Ready to make a difference?</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create a new donation and connect with those in need.</p>
        </div>
        <Link to="/donor/donate" className="btn btn-primary">
          <PlusCircle size={16} /> New Donation
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Heart size={22} color="var(--primary-light)" /></div>
          <div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Donations</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><Clock size={22} color="var(--secondary)" /></div>
          <div>
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">Active</div>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><CheckCircle size={22} color="var(--accent)" /></div>
          <div>
            <div className="stat-value">{stats.delivered}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Package size={22} color="var(--primary-light)" /></div>
          <div>
            <div className="stat-value">{stats.food}</div>
            <div className="stat-label">Food Donations</div>
          </div>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Donations</div>
            <div className="card-subtitle">Your latest donation activity</div>
          </div>
          <Link to="/donor/my-donations" className="btn btn-outline btn-sm">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : donations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎁</div>
            <div className="empty-title">No donations yet</div>
            <div className="empty-text">Start by creating your first donation!</div>
            <Link to="/donor/donate" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <PlusCircle size={16} /> Create Donation
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {donations.slice(0, 8).map(d => (
                  <tr key={d._id} style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/donations/${d._id}`}>
                    <td><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.title}</span></td>
                    <td><TypeBadge type={d.type} /></td>
                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.deliveryMode?.replace(/_/g, ' ')}</span></td>
                    <td><StatusBadge status={d.status} /></td>
                    <td><span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
