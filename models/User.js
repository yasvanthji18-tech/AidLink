const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['donor', 'volunteer', 'service_center', 'admin'],
      required: true,
    },
    phone: { type: String },
    location: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },
    isActive: { type: Boolean, default: true },
    serviceCenterId: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' },
    // Verification
    verificationStatus: {
      type: String,
      enum: ['unverified', 'verified', 'trusted'],
      default: 'unverified',
    },
    idProof: { type: String }, // placeholder / file reference
    // Volunteer gamification
    volunteerPoints: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
