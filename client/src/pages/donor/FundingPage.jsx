import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { DollarSign, Building2, CheckCircle } from 'lucide-react';

export default function FundingPage() {
  const [centers, setCenters] = useState([]);
  const [myFunding, setMyFunding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ serviceCenterId: '', amount: '', purpose: '', message: '' });
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/centers'), api.get('/funding')])
      .then(([c, f]) => { setCenters(c.data); setMyFunding(f.data); })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/funding', form);
      setSuccess(res.data);
      setMyFunding(prev => [res.data, ...prev]);
      setForm({ serviceCenterId: '', amount: '', purpose: '', message: '' });
      toast.success('Funding simulated successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process funding');
    } finally {
      setSubmitting(false);
    }
  };

  const verifiedCenters = centers.filter(c => c.verified);

  return (
    <Layout title="Fund a Center">
      <div className="page-header">
        <h1 className="page-title">Fund a Service Center</h1>
        <p className="page-subtitle">Support verified NGOs, shelters, and homes financially (simulated demo)</p>
      </div>

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <CheckCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
          <div>
            <strong>Transaction Complete!</strong><br />
            Transaction ID: <code style={{ background: 'rgba(16,185,129,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{success.transactionId}</code>
            {' '} — ₹{success.amount} to {success.serviceCenterId?.name}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Form */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1.5rem' }}>
              <DollarSign size={18} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--secondary)' }} />
              Simulate a Donation
            </div>

            <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
              ℹ️ This is a simulated transaction. No real money is transferred.
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Service Center *</label>
                {loading ? <div className="form-control" style={{ color: 'var(--text-muted)' }}>Loading centers...</div> : (
                  <select id="fund-center" className="form-control" value={form.serviceCenterId} onChange={e => setForm(f => ({...f, serviceCenterId: e.target.value}))} required>
                    <option value="">Choose a verified center</option>
                    {verifiedCenters.map(c => (
                      <option key={c._id} value={c._id}>{c.name} — {c.type?.replace(/_/g,' ')}</option>
                    ))}
                    {verifiedCenters.length === 0 && <option disabled>No verified centers yet</option>}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₹) *</label>
                <input id="fund-amount" type="number" className="form-control" placeholder="500" min="1" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} required />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {[100, 500, 1000, 5000].map(a => (
                    <button key={a} type="button" className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)', fontSize: '0.75rem' }} onClick={() => setForm(f => ({...f, amount: a}))}>₹{a}</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Purpose *</label>
                <select id="fund-purpose" className="form-control" value={form.purpose} onChange={e => setForm(f => ({...f, purpose: e.target.value}))} required>
                  <option value="">Select purpose</option>
                  <option value="food">Food & Nutrition</option>
                  <option value="medical">Medical Supplies</option>
                  <option value="education">Education</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="general">General Support</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message (Optional)</label>
                <textarea id="fund-message" className="form-control" placeholder="A note to the center..." value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} style={{ minHeight: '80px' }} />
              </div>
              <button type="submit" className="btn btn-secondary btn-full" disabled={submitting}>
                {submitting ? 'Processing...' : '💳 Simulate Payment'}
              </button>
            </form>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: '1rem' }}>My Funding History</div>
            {myFunding.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <div className="empty-icon">💳</div>
                <div className="empty-title">No funding yet</div>
                <div className="empty-text">Your transactions will appear here.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {myFunding.map(f => (
                  <div key={f._id} style={{ padding: '1rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.serviceCenterId?.name || 'Center'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{f.purpose} • {f.transactionId}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--secondary)' }}>₹{f.amount}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
