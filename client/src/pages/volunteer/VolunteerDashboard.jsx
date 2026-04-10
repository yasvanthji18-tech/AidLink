import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Truck, CheckCircle, Package, ArrowRight, Star, Trophy } from 'lucide-react';
import { VerificationBadge, PointsBadge } from '../../components/Badges';

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pickups, setPickups] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/tasks'),
      api.get('/donations'),
      api.get('/tasks/leaderboard'),
      api.get('/auth/me'),
    ])
      .then(([t, d, l, m]) => {
        setTasks(t.data);
        setPickups(d.data);
        setLeaders(l.data);
        setMe(m.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeTasks    = tasks.filter(t => ['accepted', 'collected'].includes(t.status));
  const completedTasks = tasks.filter(t => t.status === 'delivered');
  const urgentPickups  = pickups.filter(d => d.type === 'food' && d.status === 'posted');

  const myRank = leaders.findIndex(l => l._id === (me?._id || user?._id)) + 1;

  const rankClass = (i) => i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';

  return (
    <Layout title="Volunteer Dashboard">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title">Volunteer Hub 🚚</h1>
            <p className="page-subtitle">Track your tasks and find available pickups</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <VerificationBadge status={me?.verificationStatus || 'unverified'} />
            <PointsBadge points={me?.volunteerPoints || 0} />
          </div>
        </div>
      </div>

      {/* Urgent alert */}
      {urgentPickups.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚡ <strong>{urgentPickups.length} urgent food donation{urgentPickups.length > 1 ? 's' : ''}</strong> need immediate pickup!</span>
          <Link to="/volunteer/pickups?type=food" className="btn btn-sm" style={{ background: 'var(--accent)', color: 'white' }}>View Now</Link>
        </div>
      )}

      {/* Stat cards */}
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
            <div className="stat-label">Deliveries Done</div>
            {completedTasks.length > 0 && <div className="stat-change">+{completedTasks.length * 10} pts earned</div>}
          </div>
        </div>
        <div className="stat-card amber">
          <div className="stat-icon amber"><Star size={22} color="var(--accent)" /></div>
          <div>
            <div className="stat-value">{me?.volunteerPoints || 0}</div>
            <div className="stat-label">Total Points</div>
            {myRank > 0 && <div className="stat-change">Rank #{myRank}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))' }}>
          <div className="card-title" style={{ marginBottom: '0.5rem' }}>Available Pickups</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {pickups.length} donation{pickups.length !== 1 ? 's' : ''} waiting for pickup
          </p>
          <Link to="/volunteer/pickups" className="btn btn-primary">Browse Pickups <ArrowRight size={15} /></Link>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))' }}>
          <div className="card-title" style={{ marginBottom: '0.5rem' }}>My Tasks</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''} in progress
          </p>
          <Link to="/volunteer/tasks" className="btn btn-secondary">View Tasks <ArrowRight size={15} /></Link>
        </div>
      </div>

      {/* Active tasks preview */}
      {activeTasks.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Active Tasks</div>
            <Link to="/volunteer/tasks" className="btn btn-outline btn-sm">View All</Link>
          </div>
          {activeTasks.slice(0, 3).map(t => (
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

      {/* Leaderboard */}
      {leaders.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Trophy size={16} style={{ marginRight: '0.4rem' }} />Volunteer Leaderboard</div>
          </div>
          {leaders.slice(0, 5).map((l, i) => (
            <div key={l._id} className="leaderboard-item">
              <div className={`leaderboard-rank ${rankClass(i)}`}>{i + 1}</div>
              <div className="leaderboard-name">
                {l.name}
                {l._id === (me?._id || user?._id) && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)', marginLeft: '0.4rem', fontWeight: 700 }}>← you</span>
                )}
              </div>
              <VerificationBadge status={l.verificationStatus} />
              <div className="leaderboard-pts">⭐ {l.volunteerPoints}</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
