const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    donationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donation', required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'collected', 'delivered', 'cancelled'],
      default: 'assigned',
    },
    pickupAddress: { type: String },
    deliveryAddress: { type: String },
    notes: { type: String },
    acceptedAt: { type: Date },
    collectedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
