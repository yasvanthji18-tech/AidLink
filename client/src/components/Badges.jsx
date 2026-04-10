import React from 'react';

const statusColors = {
  posted: 'badge-posted',
  waiting_for_volunteer: 'badge-accepted',
  self_dropped: 'badge-accepted',
  center_picked: 'badge-accepted',
  accepted: 'badge-accepted',
  collected: 'badge-collected',
  delivered: 'badge-delivered',
  delivered_to_center: 'badge-delivered',
  received: 'badge-received',
  received_by_center: 'badge-received',
  expired: 'badge-expired',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
  initiated: 'badge-initiated',
  assigned: 'badge-accepted',
};

const typeColors = {
  food: 'badge-food',
  item: 'badge-item',
  funding: 'badge-funding',
};

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${statusColors[status] || 'badge-posted'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function TypeBadge({ type }) {
  const icons = { food: '🍱', item: '📦', funding: '💰' };
  return (
    <span className={`badge ${typeColors[type] || 'badge-item'}`}>
      {icons[type]} {type}
    </span>
  );
}

export function VerifiedBadge({ verified }) {
  return (
    <span className={`badge ${verified ? 'badge-verified' : 'badge-unverified'}`}>
      {verified ? '✓ Verified' : '✗ Unverified'}
    </span>
  );
}

// New: User verification status badge
export function VerificationBadge({ status }) {
  const config = {
    unverified: { cls: 'badge-unverified', label: '✗ Unverified' },
    verified:   { cls: 'badge-verified',   label: '✓ Verified' },
    trusted:    { cls: 'badge-trusted',    label: '⭐ Trusted' },
  };
  const c = config[status] || config.unverified;
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

// New: Demand indicator badge
export function DemandBadge({ level }) {
  const config = {
    high:   { label: '🔥 High Demand',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    medium: { label: '⚡ Medium Demand', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    low:    { label: '💤 Low Demand',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    none:   { label: '⭕ No Demand',     color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  };
  const c = config[level] || config.medium;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 700, color: c.color, background: c.bg, border: `1px solid ${c.color}40`,
    }}>
      {c.label}
    </span>
  );
}

// New: Escalation status badge
export function EscalationBadge({ status }) {
  if (!status || status === 'none') return null;
  const config = {
    notified_centers: { label: '📢 Escalated to Centers', color: '#f59e0b' },
    no_volunteers:    { label: '⚠️ No Volunteers Available', color: '#ef4444' },
  };
  const c = config[status];
  if (!c) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 700, color: c.color, background: `${c.color}18`, border: `1px solid ${c.color}40`,
    }}>
      {c.label}
    </span>
  );
}

// Removed ScheduledBadge

// New: Points badge
export function PointsBadge({ points }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)',
      border: '1px solid rgba(245,158,11,0.3)',
    }}>
      ⭐ {points || 0} pts
    </span>
  );
}
