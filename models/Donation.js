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
      enum: ['posted', 'accepted', 'collected', 'delivered', 'received', 'expired', 'cancelled'],
      default: 'posted',
    },
    assignedVolunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
    notes: { type: String },
    images: [{ type: String }],
    isExpired: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-expire food donations
donationSchema.pre('save', function () {
  if (this.type === 'food' && this.expiryTime && new Date() > this.expiryTime) {
    this.status = 'expired';
    this.isExpired = true;
  }
});

module.exports = mongoose.model('Donation', donationSchema);
