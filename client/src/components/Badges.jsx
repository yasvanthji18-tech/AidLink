import React from 'react';

const statusColors = {
  posted: 'badge-posted',
  accepted: 'badge-accepted',
  collected: 'badge-collected',
  delivered: 'badge-delivered',
  received: 'badge-received',
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
