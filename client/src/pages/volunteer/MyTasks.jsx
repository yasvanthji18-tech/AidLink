import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/Badges';
import { MapPin, User, Phone, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchTasks = () => {
    api.get('/tasks').then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (taskId, status) => {
    setUpdating(taskId);
    try {
      await api.patch(`/tasks/${taskId}/update`, { status });
      toast.success(`Status updated to "${status}" ✅`);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const nextStatus = { accepted: 'collected', collected: 'delivered' };
  const nextLabel = { accepted: '📦 Mark Collected', collected: '✅ Mark Delivered' };

  const activeTasks = tasks.filter(t => t.status !== 'delivered' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'delivered');

  return (
    <Layout title="My Tasks">
      <div className="page-header">
        <h1 className="page-title">My Tasks</h1>
        <p className="page-subtitle">{activeTasks.length} active · {completedTasks.length} completed</p>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <div className="empty-title">No tasks yet</div>
          <div className="empty-text">Accept a pickup from the Available Pickups page to see it here.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[...activeTasks, ...completedTasks].map(task => {
            const donation = task.donationId;
            return (
              <div key={task._id} className="card" style={{ borderLeft: `3px solid ${task.status === 'delivered' ? 'var(--secondary)' : 'var(--primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                      {donation?.title || 'Donation'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${donation?.type}`}>{donation?.type}</span>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {task.pickupAddress && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <MapPin size={14} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>PICKUP FROM</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{task.pickupAddress}</div>
                      </div>
                    </div>
                  )}
                  {donation?.donorId && (
                    <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>DONOR</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500 }}>
                        <User size={13} /> {donation.donorId.name}
                      </div>
                      {donation.donorId.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          <Phone size={12} /> {donation.donorId.phone}
                        </div>
                      )}
                    </div>
                  )}
                  {donation?.quantity && (
                    <div style={{ padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>QUANTITY</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500 }}>
                        <Package size={13} /> {donation.quantity}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status flow */}
                <div className="status-flow" style={{ marginBottom: '1rem' }}>
                  {['assigned', 'accepted', 'collected', 'delivered'].map((s, i) => {
                    const statuses = ['assigned', 'accepted', 'collected', 'delivered'];
                    const idx = statuses.indexOf(task.status);
                    const stepIdx = i;
                    return (
                      <React.Fragment key={s}>
                        <div className={`status-step ${stepIdx === idx ? 'active' : stepIdx < idx ? 'done' : ''}`}>
                          {stepIdx < idx ? '✓ ' : ''}{s}
                        </div>
                        {i < 3 && <span className="status-arrow">→</span>}
                      </React.Fragment>
                    );
                  })}
                </div>

                {nextStatus[task.status] && (
                  <button
                    className={`btn ${task.status === 'collected' ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={updating === task._id}
                    onClick={() => updateStatus(task._id, nextStatus[task.status])}
                  >
                    {updating === task._id ? 'Updating...' : nextLabel[task.status]}
                  </button>
                )}
                {task.status === 'delivered' && (
                  <div style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.875rem' }}>
                    ✅ Delivered {task.deliveredAt ? formatDistanceToNow(new Date(task.deliveredAt), { addSuffix: true }) : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
