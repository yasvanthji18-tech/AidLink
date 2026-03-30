const express = require('express');
const router = express.Router();
const ServiceCenter = require('../models/ServiceCenter');
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');

// GET /api/centers - List all verified centers
router.get('/', async (req, res) => {
  try {
    const { type, city } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    const centers = await ServiceCenter.find(filter).populate('managerId', 'name email phone');
    res.json(centers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/centers/:id
router.get('/:id', async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.params.id).populate('managerId', 'name email phone');
    if (!center) return res.status(404).json({ message: 'Service center not found' });
    res.json(center);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/centers - Create (called from register flow, but allow manual too)
router.post('/', protect, authorize('service_center', 'admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.create({ ...req.body, managerId: req.user._id });
    res.status(201).json(center);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/centers/:id - Update center details or needs
router.patch('/:id', protect, authorize('service_center', 'admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.params.id);
    if (!center) return res.status(404).json({ message: 'Service center not found' });

    if (req.user.role === 'service_center' && center.managerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this center' });
    }

    Object.assign(center, req.body);
    await center.save();
    res.json(center);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/centers/:id/donations - Donations assigned to this center
router.get('/:id/donations', protect, authorize('service_center', 'admin'), async (req, res) => {
  try {
    const donations = await Donation.find({ assignedCenterId: req.params.id })
      .populate('donorId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/centers/:id/accept-donation - Center accepts a donation
router.patch('/:id/accept-donation', protect, authorize('service_center'), async (req, res) => {
  try {
    const { donationId } = req.body;
    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.assignedCenterId = req.params.id;
    donation.status = 'accepted';
    await donation.save();
    res.json(donation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
