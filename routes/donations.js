const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const ServiceCenter = require('../models/ServiceCenter');
const Task = require('../models/Task');
const SystemSetting = require('../models/SystemSetting');
const { protect, authorize } = require('../middleware/auth');

// POST /api/donations - Create donation
router.post('/', protect, authorize('donor'), async (req, res) => {
  try {
    const { assignedCenterId, ...rest } = req.body;
    
    const cityDemandMap = { mumbai: 'high', delhi: 'high', bangalore: 'medium', chennai: 'medium' };
    const city = (rest.location?.city || '').toLowerCase();
    const state = (rest.location?.state || '').toLowerCase();
    const demandLevel = cityDemandMap[city] || 'medium';

    const donationData = {
      ...rest,
      deliveryMode: 'volunteer_pickup',
      donorId: req.user._id,
      demandLevel,
      statusTimeline: [{ status: 'posted', at: new Date(), by: req.user._id }],
      assignedCenterId: assignedCenterId || undefined,
      centerStatus: assignedCenterId ? 'pending' : undefined,
    };

    // If no center assigned, try auto-assignment logic
    if (!donationData.assignedCenterId) {
      const settings = await SystemSetting.findOne();
      let centerFilter = { isActive: true, verified: true }; // Only verified centers
      
      if (settings?.testMode && settings?.testCenterIds?.length > 0) {
        centerFilter._id = { $in: settings.testCenterIds };
      }

      // 1. Strict location + need match (City)
      let center = await ServiceCenter.findOne({ 
        ...centerFilter, 
        'needs.type': rest.type, 
        'location.city': new RegExp(city, 'i') 
      });

      // 2. State-level + need match
      if (!center && state) {
        center = await ServiceCenter.findOne({ 
          ...centerFilter, 
          'needs.type': rest.type, 
          'location.state': new RegExp(state, 'i') 
        });
      }

      // 3. Fallback to any center that NEEDS the type (System-wide need)
      if (!center) {
        center = await ServiceCenter.findOne({ ...centerFilter, 'needs.type': rest.type });
      }

      if (center) {
        donationData.assignedCenterId = center._id;
        donationData.centerStatus = 'pending';
      }
    }

    donationData.rejectedCenters = [];
    const donation = await Donation.create(donationData);
    console.log(`[DONATION] Created: ${donation._id} by ${req.user.name}`);
    res.status(201).json({ success: true, data: donation });
  } catch (err) {
    console.error(`[DONATION] Create Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/donations - Get donations
router.get('/', protect, async (req, res) => {
  try {
    const { type, status, deliveryMode, role } = req.query;
    let filter = {};

    if (req.user.role === 'donor') {
      filter.donorId = req.user._id;
    } else if (req.user.role === 'volunteer') {
      if (!status) filter.status = 'waiting_for_volunteer';
      filter.deliveryMode = 'volunteer_pickup';
      filter.centerStatus = 'accepted';
    } else if (role === 'center') {
      filter.assignedCenterId = req.user.serviceCenterId?._id || req.user.serviceCenterId;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (deliveryMode) filter.deliveryMode = deliveryMode;

    const donations = await Donation.find(filter)
      .populate('donorId', 'name email phone')
      .populate('assignedVolunteerId', 'name phone')
      .populate('assignedCenterId', 'name location contact')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: donations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/donations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donorId', 'name email phone')
      .populate('assignedVolunteerId', 'name phone email')
      .populate('assignedCenterId', 'name location contact');
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/donations/:id/status
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const { status, note } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    donation.status = status;
    donation.statusTimeline.push({ status, at: new Date(), by: req.user._id, note });
    await donation.save();
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/donations/:id/delivery-mode
router.patch('/:id/delivery-mode', protect, async (req, res) => {
  try {
    const { deliveryMode } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    donation.deliveryMode = deliveryMode;
    donation.statusTimeline.push({ status: donation.status, at: new Date(), by: req.user._id, note: `Delivery mode changed to ${deliveryMode}` });
    await donation.save();
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/donations/:id/retry
router.patch('/:id/retry', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.rejectedCenters = [];
    donation.centerStatus = 'pending';
    
    // Re-run assignment logic respecting test mode
    const settings = await SystemSetting.findOne();
    const city = (donation.location?.city || '').toLowerCase();
    const state = (donation.location?.state || '').toLowerCase();

    let baseFilter = { isActive: true, verified: true };

    if (settings?.testMode && settings?.testCenterIds?.length > 0) {
      baseFilter._id = { $in: settings.testCenterIds };
    }

    let center = await ServiceCenter.findOne({ ...baseFilter, 'needs.type': donation.type, 'location.city': new RegExp(city, 'i') });
    if (!center && state) center = await ServiceCenter.findOne({ ...baseFilter, 'needs.type': donation.type, 'location.state': new RegExp(state, 'i') });
    if (!center) center = await ServiceCenter.findOne({ ...baseFilter, 'needs.type': donation.type });

    if (center) {
      donation.assignedCenterId = center._id;
      donation.centerStatus = 'pending';
      donation.statusTimeline.push({ status: 'pending', at: new Date(), by: req.user._id, note: 'Retry: Re-assigned to center.' });
    } else {
      donation.centerStatus = 'rejected_by_all';
      donation.statusTimeline.push({ status: 'rejected_by_all', at: new Date(), by: req.user._id, note: 'Retry: No center found. Donor can self-drop or cancel.' });
    }

    await donation.save();
    const populated = await Donation.findById(donation._id).populate('assignedCenterId');
    res.json({ success: true, data: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/donations/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    donation.status = 'cancelled';
    donation.statusTimeline.push({ status: 'cancelled', at: new Date(), by: req.user._id, note: 'Donor cancelled donation.' });
    await donation.save();
    res.json({ success: true, data: donation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/donations/trigger-fallbacks - Process donations waiting too long (MOCK for 10 min window)
router.get('/trigger-fallbacks', protect, authorize('admin'), async (req, res) => {
  try {
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const donations = await Donation.find({
      status: 'waiting_for_volunteer',
      fallbackTriggered: false,
      waitingForVolunteerSince: { $lte: tenMinsAgo }
    });

    for (const d of donations) {
      d.fallbackTriggered = true;
      d.centerPickupRequested = true;
      d.escalationStatus = 'no_volunteers';
      d.statusTimeline.push({ status: 'waiting_for_volunteer', at: new Date(), by: req.user._id, note: 'Volunteer timeout (10m). Notifying center for pickup.' });
      await d.save();
    }

    res.json({ success: true, count: donations.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
