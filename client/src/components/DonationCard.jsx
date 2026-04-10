import React from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, TypeBadge, DemandBadge } from './Badges';
import { MapPin, Clock, Package, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DonationCard({ donation, onClick, actionLabel, onAction }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick(donation);
    else navigate(`/donations/${donation._id}`);
  };

  const isExpiringSoon = donation?.type === 'food' && donation?.expiryTime &&
    !isNaN(new Date(donation.expiryTime)) &&
    new Date(donation.expiryTime) - new Date() < 3 * 60 * 60 * 1000 &&
    donation.status === 'posted';

  return (
    <div className={`donation-card ${donation.type}`} onClick={handleClick}>
      {isExpiringSoon && (
        <div className="alert alert-warning" style={{ marginBottom: '0.75rem', padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
          ⚡ Expiring soon — urgent pickup needed!
        </div>
      )}

      {/* Escalation alert */}
      {donation.escalationStatus && donation.escalationStatus !== 'none' && (
        <div style={{ marginBottom: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.72rem', color: '#fca5a5', fontWeight: 600 }}>
          {donation.escalationStatus === 'no_volunteers' ? '⚠️ No volunteers — consider self-drop' : '📢 Escalated to nearby centers'}
        </div>
      )}

      <div className="donation-card-header">
        <div>
          <div className="donation-card-title">{donation.title}</div>
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <TypeBadge type={donation.type} />
            <StatusBadge status={donation.status} />
            {donation.demandLevel && donation.demandLevel !== 'medium' && (
              <DemandBadge level={donation.demandLevel} />
            )}
            {donation.deliveryMode && (
              <span className="badge badge-initiated" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', border: '1px solid var(--border)' }}>
                {donation.deliveryMode.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {donation.description && (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.5',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {donation.description}
        </p>
      )}

      <div className="donation-card-meta">
        {donation.location?.address && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} color="var(--primary)" />From: {donation.location.address}</span>
        )}
        {donation.assignedCenterId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Building2 size={12} color="var(--secondary)" />To: {donation.assignedCenterId.name}</span>
            {(donation.assignedCenterId.contact?.contactNumber || donation.assignedCenterId.contact?.phone) && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '15px' }}>
                📞 {donation.assignedCenterId.contact.contactNumber || donation.assignedCenterId.contact.phone}
              </span>
            )}
          </div>
        )}
        {donation.quantity && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Package size={12} />Qty: {donation.quantity}</span>
        )}
        {donation?.expiryTime && !isNaN(new Date(donation.expiryTime)) && (
          <span style={{ color: isExpiringSoon ? 'var(--accent)' : 'inherit' }}>
            <Clock size={12} style={{ display: 'inline', marginRight: '3px' }} />
            Expires {formatDistanceToNow(new Date(donation.expiryTime), { addSuffix: true })}
          </span>
        )}
      </div>

      <div className="donation-card-footer">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {donation?.donorId?.name && (
            <span><User size={11} style={{ display: 'inline', marginRight: '3px' }} />{donation.donorId.name}</span>
          )}
          <span style={{ marginLeft: '0.75rem' }}>
            {donation?.createdAt && !isNaN(new Date(donation.createdAt)) 
              ? formatDistanceToNow(new Date(donation.createdAt), { addSuffix: true })
              : 'Recently'}
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
