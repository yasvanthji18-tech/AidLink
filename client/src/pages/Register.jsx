import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Heart, Truck, Building2, ChevronRight } from 'lucide-react';

const roles = [
  { value: 'donor', label: 'Donor', desc: 'I want to donate food, items, or funds', icon: <Heart size={22} />, color: '#6366f1' },
  { value: 'volunteer', label: 'Volunteer', desc: 'I want to pickup and deliver donations', icon: <Truck size={22} />, color: '#10b981' },
  { value: 'service_center', label: 'Service Center', desc: 'I represent an NGO / shelter / home', icon: <Building2 size={22} />, color: '#f59e0b' },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || '');
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '',
    address: '', city: '', state: '',
    centerName: '', centerType: 'ngo', centerDescription: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedRole) { setError('Please select a role'); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: selectedRole,
        phone: form.phone,
        location: { address: form.address, city: form.city, state: form.state },
        ...(selectedRole === 'service_center' && {
          centerName: form.centerName || form.name,
          centerType: form.centerType,
          centerDescription: form.centerDescription,
        }),
      };
      const user = await register(payload);
      toast.success('Account created successfully!');
      const routes = { donor: '/donor', volunteer: '/volunteer', service_center: '/center', admin: '/admin' };
      navigate(routes[user.role]);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: step === 1 ? '600px' : '480px' }}>
        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: '1.5rem', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>A</div>
          <h1>AidLink</h1>
          <p>Create your account</p>
        </div>

        <div className="auth-card">
          {step === 1 ? (
            <>
              <h2 className="auth-title">Choose Your Role</h2>
              <p className="auth-subtitle">Select how you'll participate in AidLink</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {roles.map((r) => (
                  <div
                    key={r.value}
                    onClick={() => setSelectedRole(r.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '1rem', borderRadius: 'var(--radius)',
                      border: `1px solid ${selectedRole === r.value ? r.color : 'var(--border)'}`,
                      background: selectedRole === r.value ? `${r.color}15` : 'var(--bg-elevated)',
                      cursor: 'pointer', transition: 'var(--transition)',
                    }}
                  >
                    <div style={{ width: 44, height: 44, background: `${r.color}20`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.color, flexShrink: 0 }}>
                      {r.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.desc}</div>
                    </div>
                    {selectedRole === r.value && <ChevronRight size={16} style={{ marginLeft: 'auto', color: r.color }} />}
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary btn-full btn-lg"
                disabled={!selectedRole}
                onClick={() => setStep(2)}
              >
                Continue <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>← Back</button>
                <div>
                  <h2 className="auth-title" style={{ marginBottom: 0 }}>Create Account</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>as {roles.find(r => r.value === selectedRole)?.label}</p>
                </div>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input id="reg-name" type="text" className="form-control" placeholder="Your full name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input id="reg-email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input id="reg-password" type="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (Optional)</label>
                  <input id="reg-phone" type="tel" className="form-control" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input id="reg-city" type="text" className="form-control" placeholder="Mumbai" value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input id="reg-state" type="text" className="form-control" placeholder="Maharashtra" value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                  </div>
                </div>

                {selectedRole === 'service_center' && (
                  <>
                    <div className="divider"><span>Center Details</span></div>
                    <div className="form-group">
                      <label className="form-label">Center Name</label>
                      <input id="reg-center-name" type="text" className="form-control" placeholder="Hope Foundation" value={form.centerName} onChange={e => setForm({...form, centerName: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Center Type</label>
                      <select id="reg-center-type" className="form-control" value={form.centerType} onChange={e => setForm({...form, centerType: e.target.value})}>
                        <option value="ngo">NGO</option>
                        <option value="orphanage">Orphanage</option>
                        <option value="old_age_home">Old Age Home</option>
                        <option value="shelter">Shelter</option>
                        <option value="food_bank">Food Bank</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">About Your Center</label>
                      <textarea id="reg-center-desc" className="form-control" placeholder="Brief description..." value={form.centerDescription} onChange={e => setForm({...form, centerDescription: e.target.value})} style={{ minHeight: '80px' }} />
                    </div>
                  </>
                )}

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
