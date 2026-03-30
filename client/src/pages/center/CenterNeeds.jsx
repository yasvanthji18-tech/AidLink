import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function CenterNeeds() {
  const { user } = useAuth();
  const [center, setCenter] = useState(null);
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'food', description: '', quantity: '', urgency: 'medium' });

  const centerId = user?.serviceCenterId?._id || user?.serviceCenterId;

  useEffect(() => {
    if (!centerId) { setLoading(false); return; }
    api.get(`/centers/${centerId}`).then(r => {
      setCenter(r.data);
      setNeeds(r.data.needs || []);
    }).finally(() => setLoading(false));
  }, [centerId]);

  const addNeed = async () => {
    if (!form.description) { toast.error('Please enter a description'); return; }
    setSaving(true);
    try {
      const updatedNeeds = [...needs, form];
      const res = await api.patch(`/centers/${centerId}`, { needs: updatedNeeds });
      setNeeds(res.data.needs);
      setForm({ type: 'food', description: '', quantity: '', urgency: 'medium' });
      toast.success('Need added!');
    } catch (err) {
      toast.error('Failed to update needs');
    } finally {
      setSaving(false);
    }
  };

  const removeNeed = async (index) => {
    const updatedNeeds = needs.filter((_, i) => i !== index);
    try {
      const res = await api.patch(`/centers/${centerId}`, { needs: updatedNeeds });
      setNeeds(res.data.needs);
      toast.success('Need removed');
    } catch { toast.error('Failed to remove need'); }
  };

  const urgencyColor = { low: 'var(--text-muted)', medium: '#3b82f6', high: 'var(--accent)', critical: 'var(--danger)' };

  return (
    <Layout title="Manage Needs">
      <div className="page-header">
        <h1 className="page-title">Our Needs</h1>
        <p className="page-subtitle">Tell donors what your center currently needs</p>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Add need form */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1.5rem' }}>Add a Need</div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select id="need-type" className="form-control" value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                <option value="food">🍱 Food</option>
                <option value="item">📦 Items</option>
                <option value="funding">💰 Funding</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea id="need-desc" className="form-control" placeholder="e.g., Cooked meals for 50 residents daily" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} style={{ minHeight: '80px' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input id="need-qty" type="text" className="form-control" placeholder="e.g., 50 meals/day" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} />
            </div>
            <div className="form-group">
              <label className="form-label">Urgency</label>
              <select id="need-urgency" className="form-control" value={form.urgency} onChange={e => setForm(f => ({...f, urgency: e.target.value}))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">🔴 Critical</option>
              </select>
            </div>
            <button className="btn btn-primary btn-full" onClick={addNeed} disabled={saving}>
              <PlusCircle size={16} /> {saving ? 'Saving...' : 'Add Need'}
            </button>
          </div>

          {/* Current needs */}
          <div>
            <div className="card">
              <div className="card-title" style={{ marginBottom: '1rem' }}>Current Needs ({needs.length})</div>
              {needs.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem' }}>
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">No needs listed</div>
                  <div className="empty-text">Add needs so donors know what to contribute.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {needs.map((need, i) => (
                    <div key={i} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                          <span className={`badge badge-${need.type}`}>{need.type}</span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: urgencyColor[need.urgency], textTransform: 'uppercase' }}>● {need.urgency}</span>
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{need.description}</div>
                        {need.quantity && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{need.quantity}</div>}
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', padding: '0.3rem' }} onClick={() => removeNeed(i)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
