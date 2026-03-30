import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, TypeBadge } from './Badges';
import { MapPin, Clock, Package, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DonationCard({ donation, onClick, actionLabel, onAction }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick(donation);
    else navigate(`/donations/${donation._id}`);
  };

  const isExpiringSoon = donation.type === 'food' && donation.expiryTime &&
    new Date(donation.expiryTime) - new Date() < 3 * 60 * 60 * 1000 &&
    donation.status === 'posted';

  return (
    <div className={`donation-card ${donation.type}`} onClick={handleClick}>
      {isExpiringSoon && (
        <div className="alert alert-warning" style={{ marginBottom: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
          ⚡ Expiring soon — urgent pickup needed!
        </div>
      )}
      <div className="donation-card-header">
        <div>
          <div className="donation-card-title">{donation.title}</div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <TypeBadge type={donation.type} />
            <StatusBadge status={donation.status} />
          </div>
        </div>
      </div>

      {donation.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5' }}>
          {donation.description}
        </p>
      )}

      <div className="donation-card-meta">
        {donation.location?.address && (
          <span><MapPin size={12} style={{ display: 'inline', marginRight: '3px' }} />{donation.location.address}</span>
        )}
        {donation.quantity && (
          <span><Package size={12} style={{ display: 'inline', marginRight: '3px' }} />Qty: {donation.quantity}</span>
        )}
        {donation.expiryTime && (
          <span style={{ color: isExpiringSoon ? 'var(--accent)' : 'inherit' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
            Expires {formatDistanceToNow(new Date(donation.expiryTime), { addSuffix: true })}
          </span>
        )}
      </div>

      <div className="donation-card-footer">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {donation.donorId?.name && (
            <span><User size={11} style={{ display: 'inline', marginRight: '3px' }} />{donation.donorId.name}</span>
          )}
          <span style={{ marginLeft: '0.75rem' }}>
            {formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })}
          </span>
        </div>
        {onAction && (
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => { e.stopPropagation(); onAction(donation); }}
          >
            {actionLabel || 'View'}
          </button>
        )}
      </div>
    </div>
  );
}
