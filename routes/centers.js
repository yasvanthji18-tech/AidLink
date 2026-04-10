const express = require('express');
const router = express.Router();
const ServiceCenter = require('../models/ServiceCenter');
const Donation = require('../models/Donation');
const SystemSetting = require('../models/SystemSetting');
const { protect, authorize } = require('../middleware/auth');

// GET /api/centers - List all verified centers
router.get('/', async (req, res) => {
  try {
    const { type, city } = req.query;
    const filter = { isActive: true };
    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    const centers = await ServiceCenter.find(filter).populate('managerId', 'name email phone');
    res.json({ success: true, data: centers });
  } catch (err) {
    console.error(`[CENTER] List Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/centers/:id
router.get('/:id', async (req, res) => {
  try {
    const center = await ServiceCenter.findById(req.params.id).populate('managerId', 'name email phone');
    if (!center) return res.status(404).json({ success: false, message: 'Service center not found' });
    res.json({ success: true, data: center });
  } catch (err) {
    console.error(`[CENTER] Detail Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/centers - Create (called from register flow, but allow manual too)
router.post('/', protect, authorize('service_center', 'admin'), async (req, res) => {
  try {
    const center = await ServiceCenter.create({ ...req.body, managerId: req.user._id });
    console.log(`[CENTER] Created: ${center.name} by ${req.user.name}`);
    res.status(201).json({ success: true, data: center });
  } catch (err) {
    console.error(`[CENTER] Create Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
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
    console.log(`[CENTER] Updated: ${center.name}`);
    res.json({ success: true, data: center });
  } catch (err) {
    console.error(`[CENTER] Update Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/centers/:id/donations - Donations assigned to this center
router.get('/:id/donations', protect, authorize('service_center', 'admin'), async (req, res) => {
  try {
    const donations = await Donation.find({ assignedCenterId: req.params.id })
      .populate('donorId', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: donations });
  } catch (err) {
    console.error(`[CENTER] Fetch Donations Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/centers/:id/respond-donation - Center accepts or rejects a donation
router.patch('/:id/respond-donation', protect, authorize('service_center'), async (req, res) => {
  try {
    const { donationId, action } = req.body; // 'accept' or 'reject'
    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.centerStatus !== 'pending') {
      return res.status(400).json({ success: false, message: `Donation already has center status: ${donation.centerStatus}` });
    }

    if (action === 'accept') {
      donation.assignedCenterId = req.params.id;
      donation.centerStatus = 'accepted';
      donation.status = 'waiting_for_volunteer';
      donation.waitingForVolunteerSince = new Date();
      donation.statusTimeline.push({ status: 'waiting_for_volunteer', at: new Date(), by: req.user._id, note: 'Center accepted' });
    } else if (action === 'reject') {
      donation.centerStatus = 'rejected';
      donation.rejectedCenters.push(req.params.id);
      
      // Auto-escalation to next center that needs this type
      const settings = await SystemSetting.findOne();
      let centerQuery = { 
        _id: { $nin: donation.rejectedCenters }, 
        isActive: true,
        verified: true,
        'needs.type': donation.type
      };

      // In test mode, additionally restrict to the test pool using $and
      if (settings?.testMode && settings?.testCenterIds?.length > 0) {
        centerQuery = {
          $and: [
            { _id: { $nin: donation.rejectedCenters } },
            { _id: { $in: settings.testCenterIds } },
          ],
          isActive: true,
          verified: true,
          'needs.type': donation.type
        };
      }

      const nextCenter = await ServiceCenter.findOne(centerQuery);
      
      if (nextCenter) {
        donation.assignedCenterId = nextCenter._id;
        donation.centerStatus = 'pending';
        donation.statusTimeline.push({ 
          status: 'pending', 
          at: new Date(), 
          by: req.user._id, 
          note: `Rejected by ${req.user.name}. Re-assigned to ${nextCenter.name}.` 
        });
      } else {
        // Final fallback: rejected by all relevant centers — keep as 'posted' so donors can retry/cancel
        donation.centerStatus = 'rejected_by_all';
        donation.status = 'posted';
        donation.statusTimeline.push({ 
          status: 'rejected_by_all', 
          at: new Date(), 
          by: req.user._id, 
          note: donation.type === 'food' 
            ? 'No service center is currently available to accept this food donation. Donor can retry or self-drop.'
            : 'No service center currently accepts this item. Donor can retry or cancel.'
        });
      }
    }
    await donation.save();
    console.log(`[CENTER] Respond: ${donationId} by ${req.params.id} -> ${action}`);
    res.json({ success: true, data: donation });
  } catch (err) {
    console.error(`[CENTER] Respond Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/centers/:id/respond-pickup - Center confirms or declines pickup fallback
router.patch('/:id/respond-pickup', protect, authorize('service_center'), async (req, res) => {
  try {
    const { donationId, action } = req.body; // 'confirm' or 'decline'
    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ success: false, message: 'Donation not found' });

    if (donation.centerPickupResponse !== 'none') {
      return res.status(400).json({ success: false, message: `Already responded to pickup request: ${donation.centerPickupResponse}` });
    }

    if (action === 'confirm') {
      donation.centerPickupResponse = 'confirmed';
      donation.status = 'center_picked';
      donation.statusTimeline.push({ status: 'center_picked', at: new Date(), by: req.user._id, note: 'Center confirmed pickup' });
    } else if (action === 'decline') {
      donation.centerPickupResponse = 'declined';
      donation.rejectedCenters.push(req.params.id);
      
      // Escalate to next center for pickup fallback
      const settings2 = await SystemSetting.findOne();
      let pickupQuery = { 
        _id: { $nin: donation.rejectedCenters }, 
        isActive: true,
        verified: true,
        'needs.type': donation.type
      };

      if (settings2?.testMode && settings2?.testCenterIds?.length > 0) {
        pickupQuery = {
          $and: [
            { _id: { $nin: donation.rejectedCenters } },
            { _id: { $in: settings2.testCenterIds } },
          ],
          isActive: true,
          verified: true,
          'needs.type': donation.type
        };
      }

      const nextCenter = await ServiceCenter.findOne(pickupQuery);
      
      if (nextCenter) {
        donation.assignedCenterId = nextCenter._id;
        donation.centerStatus = 'pending';
        donation.centerPickupRequested = false;
        donation.centerPickupResponse = 'none';
        donation.fallbackTriggered = false;
        donation.status = 'posted';
        donation.statusTimeline.push({ status: 'posted', at: new Date(), by: req.user._id, note: `Pickup declined. Re-assigned to ${nextCenter.name}.` });
      } else {
        donation.centerStatus = 'rejected_by_all';
        donation.status = 'posted'; // Keep as posted so donor can retry/self-drop
        donation.statusTimeline.push({ status: 'rejected_by_all', at: new Date(), by: req.user._id, note: 'No pickup center available. Donor notified to retry or self-drop.' });
      }
    }
    await donation.save();
    console.log(`[CENTER] Respond Pickup: ${donationId} -> ${action}`);
    res.json({ success: true, data: donation });
  } catch (err) {
    console.error(`[CENTER] Respond Pickup Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
