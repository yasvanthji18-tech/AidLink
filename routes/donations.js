const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Task = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

// POST /api/donations - Create donation
router.post('/', protect, authorize('donor'), async (req, res) => {
  try {
    const donation = await Donation.create({ ...req.body, donorId: req.user._id });
    res.status(201).json(donation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/donations - Get donations (filtered)
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, deliveryMode, role } = req.query;
    let filter = {};

    if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    } else if (req.user.role === 'volunteer') {
      // Volunteers see posted donations available for pickup
      if (!status) filter.status = 'posted';
      filter.deliveryMode = 'volunteer_pickup';
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (deliveryMode) filter.deliveryMode = deliveryMode;

    // Auto-expire food donations
    await Donation.updateMany(
      { type: 'food', expiryTime: { $lt: new Date() }, status: { $nin: ['expired', 'delivered'] } },
      { status: 'expired', isExpired: true }
    );

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email phone')
      .populate('assignedVolunteerId', 'name phone')
      .populate('assignedCenterId', 'name location')
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/donations/all - Admin/centers see all
router.get('/all', protect, authorize('admin', 'service_center'), async (req, res) => {
  try {
    const { type, status } = req.query;
    let filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const donations = await Donation.find(filter)
      .populate('donorId', 'name email')
      .populate('assignedVolunteerId', 'name')
      .populate('assignedCenterId', 'name')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/donations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone')
      .populate('assignedVolunteerId', 'name phone email')
      .populate('assignedCenterId', 'name location contact');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/donations/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, assignedCenterId } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.status = status;
    if (assignedCenterId) donation.assignedCenterId = assignedCenterId;
    await donation.save();

    res.json(donation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/donations/:id
router.delete('/:id', protect, authorize('donor', 'admin'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (req.user.role === 'donor' && donation.donorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    donation.status = 'cancelled';
    await donation.save();
    res.json({ message: 'Donation cancelled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
