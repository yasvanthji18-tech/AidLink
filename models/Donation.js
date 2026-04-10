const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['food', 'item', 'funding'], required: true },
    title: { type: String, required: true },
    description: { type: String },
    quantity: { type: String },
    location: {
      address: { type: String, required: true },
      city: String,
      state: String,
      pincode: String,
    },
    // Food specific
    expiryTime: { type: Date },
    pickupTime: { type: Date },
    foodName: { type: String },
    // Item specific
    condition: { type: String, enum: ['new', 'good', 'fair', 'poor'] },
    itemCategory: { type: String },
    // Delivery
    deliveryMode: {
      type: String,
      enum: ['volunteer_pickup', 'self_drop', 'service_center_pickup'],
      required: true,
    },
    status: {
      type: String,
      enum: ['posted', 'waiting_for_volunteer', 'self_dropped', 'center_picked', 'accepted', 'assigned', 'collected', 'delivered', 'received', 'ReceivedByCenter', 'delivered_to_center', 'received_by_center', 'expired', 'cancelled'],
      default: 'posted',
    },
    assignedVolunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
    centerStatus: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    deliveredToCenterAt: { type: Date },
    notes: { type: String },
    images: [{ type: String }],
    isExpired: { type: Boolean, default: false },
    // Escalation
    escalationStatus: {
      type: String,
      enum: ['none', 'notified_centers', 'no_volunteers'],
      default: 'none',
    },
    escalatedAt: { type: Date },
    // Proof-based delivery
    deliveredAt: { type: Date },
    deliveryProof: { type: String }, // photo URL or placeholder
    // Demand awareness (city-level mock)
    demandLevel: { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'medium' },
    // Status timeline audit trail
    statusTimeline: [
      {
        status: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String,
      },
    ],
    // Multi-center retry
    rejectedCenters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' }],
    // Fallback/No-volunteer handling
    fallbackTriggered: { type: Boolean, default: false },
    waitingForVolunteerSince: { type: Date }, // Added for timeout
    centerPickupRequested: { type: Boolean, default: false },
    centerPickupResponse: { type: String, enum: ['none', 'confirmed', 'declined'], default: 'none' },
  },
  { timestamps: true }
);

// Auto-expire food donations
donationSchema.pre('save', async function () {
  if (this.type === 'food' && this.expiryTime && new Date() > this.expiryTime) {
    this.status = 'expired';
    this.isExpired = true;
  }
});

module.exports = mongoose.model('Donation', donationSchema);
