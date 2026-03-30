import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { PlusCircle, Info } from 'lucide-react';

const deliveryModes = [
  { value: 'volunteer_pickup', label: '🚚 Volunteer Pickup', desc: 'A volunteer will come to your location' },
  { value: 'self_drop', label: '🏠 Self Drop', desc: 'You will drop it off at the center' },
  { value: 'service_center_pickup', label: '🏢 Center Pickup', desc: 'Service center will arrange pickup' },
];

export default function CreateDonation() {
  const navigate = useNavigate();
  const [type, setType] = useState('food');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', quantity: '',
    address: '', city: '', state: '',
    deliveryMode: 'volunteer_pickup', notes: '',
    // food
    foodName: '', expiryTime: '', pickupTime: '',
    // item
    condition: 'good', itemCategory: '',
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/donations', {
        type,
        title: form.title,
        description: form.description,
        quantity: form.quantity,
        location: { address: form.address, city: form.city, state: form.state },
        deliveryMode: form.deliveryMode,
        notes: form.notes,
        ...(type === 'food' && {
          foodName: form.foodName,
          expiryTime: form.expiryTime ? new Date(form.expiryTime).toISOString() : undefined,
          pickupTime: form.pickupTime ? new Date(form.pickupTime).toISOString() : undefined,
        }),
        ...(type === 'item' && {
          condition: form.condition,
          itemCategory: form.itemCategory,
        }),
      });
      toast.success('Donation created successfully! 🎉');
      navigate('/donor/my-donations');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Create Donation">
      <div className="page-header">
        <h1 className="page-title">Create a Donation</h1>
        <p className="page-subtitle">Fill in the details to post your donation</p>
      </div>

      <div style={{ maxWidth: '680px' }}>
        {/* Type Selector */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>What are you donating?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
              { val: 'food', label: '🍱 Food', desc: 'Time-sensitive' },
              { val: 'item', label: '📦 Items', desc: 'Clothes, Books...' },
            ].map(t => (
              <div key={t.val}
                onClick={() => setType(t.val)}
                style={{
                  padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center',
                  border: `2px solid ${type === t.val ? 'var(--primary)' : 'var(--border)'}`,
                  background: type === t.val ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{t.label.split(' ')[0]}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{t.label.split(' ')[1]}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
            ))}
            <div
              onClick={() => { toast('To fund a center, use the Fund a Center section', { icon: 'ℹ️' }); navigate('/donor/funding'); }}
              style={{
                padding: '1rem', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center',
                border: '2px solid var(--border)', background: 'var(--bg-elevated)', transition: 'var(--transition)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>💰</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Funding</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Fund centers →</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Basic Details</div>
            <div className="form-group">
              <label className="form-label">Donation Title *</label>
              <input id="don-title" type="text" className="form-control" placeholder={type === 'food' ? 'e.g., Fresh cooked dal rice' : 'e.g., Winter clothes bundle'} value={form.title} onChange={e => update('title', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea id="don-desc" className="form-control" placeholder="Describe what you're donating..." value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity / Amount</label>
              <input id="don-qty" type="text" className="form-control" placeholder={type === 'food' ? 'e.g., Serves 20 people' : 'e.g., 5 bags of clothes'} value={form.quantity} onChange={e => update('quantity', e.target.value)} />
            </div>

            {/* Food specific */}
            {type === 'food' && (
              <div>
                <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                  ⚡ Food donations are time-sensitive. Please set an accurate expiry time.
                </div>
                <div className="form-group">
                  <label className="form-label">Food Name</label>
                  <input id="don-food-name" type="text" className="form-control" placeholder="e.g., Biryani, Dal Rice, Bread" value={form.foodName} onChange={e => update('foodName', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Expiry Time *</label>
                    <input id="don-expiry" type="datetime-local" className="form-control" value={form.expiryTime} onChange={e => update('expiryTime', e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Available For Pickup</label>
                    <input id="don-pickup-time" type="datetime-local" className="form-control" value={form.pickupTime} onChange={e => update('pickupTime', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Item specific */}
            {type === 'item' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select id="don-category" className="form-control" value={form.itemCategory} onChange={e => update('itemCategory', e.target.value)}>
                    <option value="">Select category</option>
                    <option value="clothes">Clothes</option>
                    <option value="books">Books</option>
                    <option value="toys">Toys</option>
                    <option value="furniture">Furniture</option>
                    <option value="electronics">Electronics</option>
                    <option value="essentials">Essentials</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Condition</label>
                  <select id="don-condition" className="form-control" value={form.condition} onChange={e => update('condition', e.target.value)}>
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Pickup Location</div>
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input id="don-address" type="text" className="form-control" placeholder="Street address, landmark" value={form.address} onChange={e => update('address', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input id="don-city" type="text" className="form-control" placeholder="Mumbai" value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input id="don-state" type="text" className="form-control" placeholder="Maharashtra" value={form.state} onChange={e => update('state', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Delivery Mode */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-title" style={{ marginBottom: '1rem' }}>Delivery Preference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {deliveryModes.map(m => (
                <div key={m.value}
                  onClick={() => update('deliveryMode', m.value)}
                  style={{
                    padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `2px solid ${form.deliveryMode === m.value ? 'var(--primary)' : 'var(--border)'}`,
                    background: form.deliveryMode === m.value ? 'var(--primary-glow)' : 'transparent',
                    transition: 'var(--transition)', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Additional Notes</label>
              <textarea id="don-notes" className="form-control" placeholder="Any special instructions or notes..." value={form.notes} onChange={e => update('notes', e.target.value)} style={{ minHeight: '80px' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            <PlusCircle size={18} /> {loading ? 'Publishing...' : 'Publish Donation'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
