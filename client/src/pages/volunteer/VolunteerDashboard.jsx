import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import { Truck, CheckCircle, Package, ArrowRight, Clock } from 'lucide-react';

export default function VolunteerDashboard() {
  const [tasks, setTasks] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/tasks'), api.get('/donations')])
      .then(([t, d]) => { setTasks(t.data); setPickups(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const activeTasks = tasks.filter(t => ['accepted', 'collected'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'delivered');
  const urgentPickups = pickups.filter(d => d.type === 'food' && d.status === 'posted');

  return (
    <Layout title="Volunteer Dashboard">
      <div className="page-header">
        <h1 className="page-title">Volunteer Hub 🚚</h1>
        <p className="page-subtitle">Track your tasks and find available pickups</p>
      </div>

      {urgentPickups.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚡ <strong>{urgentPickups.length} urgent food donation{urgentPickups.length > 1 ? 's' : ''}</strong> need immediate pickup!</span>
          <Link to="/volunteer/pickups?type=food" className="btn btn-sm" style={{ background: 'var(--accent)', color: 'white' }}>View Now</Link>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon"><Truck size={22} color="var(--primary-light)" /></div>
          <div>
            <div className="stat-value">{activeTasks.length}</div>
            <div className="stat-label">Active Tasks</div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon green"><CheckCircle size={22} color="var(--secondary)" /></div>
          <div>
            <div className="stat-value">{completedTasks.length}</div>
            <div className="stat-label">Deliveries Completed</div>
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Package size={22} color="var(--accent)" /></div>
          <div>
            <div className="stat-value">{pickups.length}</div>
            <div className="stat-label">Available Pickups</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Quick links */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))' }}>
          <div className="card-title" style={{ marginBottom: '0.5rem' }}>Available Pickups</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{pickups.length} donation{pickups.length !== 1 ? 's' : ''} waiting to be picked up</p>
          <Link to="/volunteer/pickups" className="btn btn-primary">Browse Pickups <ArrowRight size={15} /></Link>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))' }}>
          <div className="card-title" style={{ marginBottom: '0.5rem' }}>My Tasks</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in progress</p>
          <Link to="/volunteer/tasks" className="btn btn-secondary">View Tasks <ArrowRight size={15} /></Link>
        </div>
      </div>

      {/* Active tasks mini preview */}
      {activeTasks.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Active Tasks</div>
            <Link to="/volunteer/tasks" className="btn btn-outline btn-sm">View All</Link>
          </div>
          {activeTasks.slice(0,3).map(t => (
            <div key={t._id} style={{ padding: '0.875rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.donationId?.title || 'Donation'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{t.pickupAddress}</div>
              </div>
              <span className={`badge badge-${t.status}`}>{t.status}</span>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
