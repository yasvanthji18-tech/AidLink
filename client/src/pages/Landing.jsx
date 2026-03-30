import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Truck, Building2, Shield, ArrowRight, Package, Users, CheckCircle } from 'lucide-react';

const features = [
  { icon: '🍱', title: 'Food Redistribution', desc: 'Time-sensitive food donations routed to communities with urgent needs before expiry.' },
  { icon: '📦', title: 'Item Donations', desc: 'Clothes, books, and essentials matched to verified service centers and NGOs.' },
  { icon: '💰', title: 'Financial Support', desc: 'Fund verified service centers directly with full transparency and tracking.' },
  { icon: '🚚', title: 'Volunteer Network', desc: 'Connect volunteers with pickup tasks for seamless last-mile delivery.' },
  { icon: '🏠', title: 'Service Centers', desc: 'Old age homes, orphanages, and shelters define their needs and receive matched donations.' },
  { icon: '📊', title: 'Real-time Tracking', desc: 'Track every donation from creation to delivery with status updates.' },
];

const stats = [
  { value: '10K+', label: 'Food Meals Saved' },
  { value: '500+', label: 'Volunteers Active' },
  { value: '200+', label: 'Service Centers' },
  { value: '50K+', label: 'Lives Impacted' },
];

const roles = [
  { icon: <Heart size={24} />, title: 'Donor', desc: 'Donate food, items, or funds', color: '#6366f1', path: '/register?role=donor' },
  { icon: <Truck size={24} />, title: 'Volunteer', desc: 'Pickup and deliver donations', color: '#10b981', path: '/register?role=volunteer' },
  { icon: <Building2 size={24} />, title: 'Service Center', desc: 'Register your NGO / shelter', color: '#f59e0b', path: '/register?role=service_center' },
];

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-icon">A</div>
          <span className="logo-text" style={{ fontSize: '1.4rem' }}>AidLink</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link to="/login" className="btn btn-ghost">Sign In</Link>
          <Link to="/register" className="btn btn-primary">Get Started <ArrowRight size={16} /></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="hero-glow" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge">
            <CheckCircle size={14} /> Verified Resource Redistribution Platform
          </div>
          <h1 className="hero-title">
            Connect. Donate.<br />
            <span className="gradient-text">Transform Lives.</span>
          </h1>
          <p className="hero-subtitle">
            AidLink bridges the gap between donors, volunteers, and verified service centers
            to ensure food, essentials, and support reach those who need it most.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Donating <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              Sign In to Dashboard
            </Link>
          </div>

          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-value">{s.value}</div>
                <div className="hero-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '4rem 5%', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title">How AidLink Works</h2>
          <p className="section-subtitle">A simple 3-step process to make a difference</p>
          <div className="grid grid-3" style={{ marginTop: '2rem' }}>
            {[
              { step: '01', title: 'Donor Creates', desc: 'Donor posts food, items, or funds with location and pickup preferences.' },
              { step: '02', title: 'Volunteer Connects', desc: 'Volunteer accepts the pickup task and coordinates collection and delivery.' },
              { step: '03', title: 'Center Receives', desc: 'Verified service center receives the donation and tracks their inventory.' },
            ].map((s) => (
              <div key={s.step} style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '900', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>{s.step}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2 className="section-title">Everything You Need</h2>
        <p className="section-subtitle">A complete platform for coordinating humanitarian resource redistribution</p>
        <div className="grid grid-3">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Join Section */}
      <section style={{ padding: '4rem 5%', background: 'rgba(99,102,241,0.05)', borderTop: '1px solid rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="section-title">Join as Your Role</h2>
          <p className="section-subtitle">AidLink serves donors, volunteers, and service centers with tailored dashboards</p>
          <div className="role-cards" style={{ marginTop: '2rem' }}>
            {roles.map((r) => (
              <Link key={r.title} to={r.path} style={{ textDecoration: 'none' }}>
                <div className="role-card">
                  <div style={{ width: '56px', height: '56px', background: `${r.color}20`, border: `1px solid ${r.color}40`, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: r.color }}>
                    {r.icon}
                  </div>
                  <div className="role-title">{r.title}</div>
                  <div className="role-desc">{r.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-logo">AidLink</div>
        <p className="footer-tagline">Resource Redistribution Platform — Connecting Compassion with Need</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
          © {new Date().getFullYear()} AidLink. Built to make a difference.
        </p>
      </footer>
    </div>
  );
}
