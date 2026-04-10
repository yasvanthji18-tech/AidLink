const mongoose = require('mongoose');

const serviceCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    address: { type: String }, // Added as per requirement
    type: {
      type: String,
      enum: ['old_age_home', 'orphanage', 'ngo', 'shelter', 'food_bank', 'other'],
      required: true,
    },
    description: { type: String },
    location: {
      address: { type: String, required: true },
      city: String,
      state: String,
      pincode: String,
    },
    contact: {
      phone: String,
      email: String,
      website: String,
      contactNumber: { type: String, required: true }, // Added as per requirement
    },
    needs: [
      {
        type: { type: String, enum: ['food', 'item', 'funding'] },
        description: String,
        quantity: String,
        urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
      },
    ],
    capacity: { type: Number },
    currentOccupancy: { type: Number },
    verified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified'],
      default: 'unverified',
    },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registrationNumber: { type: String },
    documents: [{ type: String }],
    rating: { type: Number, default: 0 },
    totalDonationsReceived: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceCenter', serviceCenterSchema);
