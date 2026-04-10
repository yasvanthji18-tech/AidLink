import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { StatusBadge } from '../../components/Badges';
import { MapPin, User, Phone, Package, Camera, Star, Building2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const STEPS = ['assigned', 'collected', 'delivered_to_center'];
const STEP_ICONS = { assigned: '📋', collected: '📦', delivered_to_center: '✅' };

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [proofInputs, setProofInputs] = useState({}); // taskId -> proof URL string

  const fetchTasks = () => {
    api.get('/tasks').then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const updateStatus = async (taskId, status) => {
    setUpdating(taskId);
    try {
      const proof = proofInputs[taskId];
      await api.patch(`/tasks/${taskId}/update`, {
        status,
        ...(status === 'delivered_to_center' && proof ? { deliveryProof: proof } : {}),
      });

      // Update state immediately for instant feedback
      setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t));

      toast.success(
        status === 'delivered_to_center'
          ? '✅ Delivered! +10 points earned!'
          : `Status updated to "${status}" ✅`
      );
      setProofInputs(p => { const copy = { ...p }; delete copy[taskId]; return copy; });
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const nextStatus = { assigned: 'collected', collected: 'delivered_to_center' };
  const nextLabel  = { assigned: '📦 Mark Collected', collected: '✅ Mark Delivered to Center' };

  const activeTasks    = tasks.filter(t => t.status !== 'delivered_to_center' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'delivered_to_center');

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {[...activeTasks, ...completedTasks].map(task => {
            const donation = task.donationId;
            const isDelivered = task.status === 'delivered_to_center';
            return (
              <div key={task._id} className="card" style={{
                borderLeft: `3px solid ${isDelivered ? 'var(--secondary)' : 'var(--primary)'}`,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>
                      {donation?.title || 'Donation'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className={`badge badge-${donation?.type}`}>{donation?.type}</span>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {task.createdAt && !isNaN(new Date(task.createdAt)) 
                      ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })
                      : 'Recently'}
                  </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {task.pickupAddress && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <MapPin size={14} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>PICKUP FROM</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{task.pickupAddress}</div>
                      </div>
                    </div>
                  )}
                  {donation?.assignedCenterId && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                      <Building2 size={14} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>DELIVER TO CENTER</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{donation.assignedCenterId.name}</div>
                        {donation.assignedCenterId.location?.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{donation.assignedCenterId.location.address}</div>}
                        
                        {donation.assignedCenterId.contact?.contactNumber ? (
                          <div style={{ marginTop: '0.4rem' }}>
                            <a href={`tel:${donation.assignedCenterId.contact.contactNumber}`} className="btn btn-xs btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                              📞 Call Center: {donation.assignedCenterId.contact.contactNumber}
                            </a>
                          </div>
                        ) : donation.assignedCenterId.contact?.phone ? (
                          <div style={{ marginTop: '0.4rem' }}>
                            <a href={`tel:${donation.assignedCenterId.contact.phone}`} className="btn btn-xs btn-outline" style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}>
                              📞 Call Center: {donation.assignedCenterId.contact.phone}
                            </a>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.2rem' }}>Contact details not available</div>
                        )}
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

                {/* Status Timeline */}
                <div className="timeline" style={{ marginBottom: '1rem' }}>
                  {STEPS.map((s, i) => {
                    const idx = STEPS.indexOf(task.status);
                    const isDone   = i < idx || isDelivered;
                    const isActive = i === idx && !isDelivered;
                    // find timestamps from task
                    const tsMap = { assigned: task.acceptedAt, collected: task.collectedAt, delivered_to_center: task.deliveredAt };
                    return (
                      <div key={s} className="timeline-item">
                        <div className={`timeline-dot ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                          {isDone ? '✓' : STEP_ICONS[s]}
                        </div>
                        <div className="timeline-body">
                          <div className="timeline-label">{s}</div>
                          {tsMap[s] && !isNaN(new Date(tsMap[s])) && (
                            <div className="timeline-time">
                              {format(new Date(tsMap[s]), 'dd MMM, hh:mm a')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Delivered proof display */}
                {isDelivered && task.deliveryProof && (
                  <div className="proof-block" style={{ marginBottom: '1rem' }}>
                    <div className="proof-placeholder">📸</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>DELIVERY PROOF</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{task.deliveryProof}</div>
                    </div>
                  </div>
                )}

                {/* Proof input for "collected" tasks before marking delivered */}
                {task.status === 'collected' && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Camera size={13} /> DELIVERY PROOF (optional)
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      style={{ fontSize: '0.82rem' }}
                      placeholder="Paste proof URL or description (e.g. 'Delivered to reception at 3PM')"
                      value={proofInputs[task._id] || ''}
                      onChange={e => setProofInputs(p => ({ ...p, [task._id]: e.target.value }))}
                    />
                  </div>
                )}

                {/* Action button */}
                {nextStatus[task.status] && (
                  <button
                    className={`btn ${task.status === 'collected' ? 'btn-secondary' : 'btn-primary'}`}
                    disabled={updating === task._id}
                    onClick={() => updateStatus(task._id, nextStatus[task.status])}
                  >
                    {updating === task._id ? 'Updating...' : nextLabel[task.status]}
                  </button>
                )}

                {isDelivered && (
                  <div style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Star size={14} fill="currentColor" />
                    Delivered {task.deliveredAt && !isNaN(new Date(task.deliveredAt)) ? formatDistanceToNow(new Date(task.deliveredAt), { addSuffix: true }) : 'Successfully'} · +10 pts earned
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
