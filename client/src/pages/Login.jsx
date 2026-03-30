import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      const routes = { donor: '/donor', volunteer: '/volunteer', service_center: '/center', admin: '/admin' };
      navigate(routes[user.role] || '/donor');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Donor', email: 'donor@demo.com', pass: 'demo1234' },
    { role: 'Volunteer', email: 'volunteer@demo.com', pass: 'demo1234' },
    { role: 'Service Center', email: 'center@demo.com', pass: 'demo1234' },
    { role: 'Admin', email: 'admin@demo.com', pass: 'demo1234' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 56, height: 56, fontSize: '1.5rem', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>A</div>
          <h1>AidLink</h1>
          <p>Resource Redistribution Platform</p>
        </div>

        <div className="auth-card">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="form-control"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingRight: '2.5rem' }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="divider"><span>Demo Accounts</span></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {demoAccounts.map((d) => (
              <button
                key={d.role}
                className="btn btn-ghost"
                style={{ fontSize: '0.75rem', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', textAlign: 'left', flexDirection: 'column', alignItems: 'flex-start' }}
                onClick={() => setForm({ email: d.email, password: d.pass })}
              >
                <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{d.role}</span>
                <span style={{ color: 'var(--text-muted)' }}>{d.email}</span>
              </button>
            ))}
          </div>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
