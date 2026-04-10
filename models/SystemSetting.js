const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema(
  {
    testMode: { type: Boolean, default: false },
    testCenterIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ServiceCenter' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
