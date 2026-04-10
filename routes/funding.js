const express = require('express');
const router = express.Router();
const Funding = require('../models/Funding');
const ServiceCenter = require('../models/ServiceCenter');
const { protect, authorize } = require('../middleware/auth');

// POST /api/funding - Create simulated funding
router.post('/', protect, authorize('donor'), async (req, res) => {
  try {
    const { serviceCenterId, amount, purpose, message } = req.body;
    if (!serviceCenterId || !amount || !purpose) {
      return res.status(400).json({ success: false, message: 'serviceCenterId, amount, and purpose are required' });
    }

    const center = await ServiceCenter.findById(serviceCenterId);
    if (!center) return res.status(404).json({ success: false, message: 'Service center not found' });

    const funding = await Funding.create({
      donorId: req.user._id,
      serviceCenterId,
      amount,
      purpose,
      message,
      status: 'initiated',
    });

    // Simulate processing delay and mark as completed
    funding.status = 'completed';
    funding.completedAt = new Date();
    await funding.save();

    center.totalDonationsReceived += amount;
    await center.save();

    const populated = await Funding.findById(funding._id)
      .populate('donorId', 'name email')
      .populate('serviceCenterId', 'name type location');
    
    console.log(`[FUNDING] Created: ${funding._id} by ${req.user.name} for ${center.name}`);
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error(`[FUNDING] Create Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/funding - Get funding records
router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'donor') filter.donorId = req.user._id;
    const records = await Funding.find(filter)
      .populate('donorId', 'name email')
      .populate('serviceCenterId', 'name type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: records });
  } catch (err) {
    console.error(`[FUNDING] Fetch Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
