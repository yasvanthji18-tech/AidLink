const mongoose = require('mongoose');

const fundingSchema = new mongoose.Schema(
  {
    donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    serviceCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    purpose: { type: String, required: true },
    message: { type: String },
    status: {
      type: String,
      enum: ['initiated', 'processing', 'completed', 'failed', 'refunded'],
      default: 'initiated',
    },
    transactionId: { type: String, default: () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}` },
    paymentMethod: { type: String, default: 'simulated' },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Funding', fundingSchema);
