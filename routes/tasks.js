const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// POST /api/tasks/accept - Volunteer accepts a donation
router.post('/accept', protect, authorize('volunteer'), async (req, res) => {
  try {
    const { donationId } = req.body;
    
    // Atomic check and update
    const donation = await Donation.findOneAndUpdate(
      { 
        _id: donationId, 
        $or: [
          { assignedVolunteerId: { $exists: false } }, 
          { assignedVolunteerId: null }
        ],
        status: 'waiting_for_volunteer' 
      },
      { assignedVolunteerId: req.user._id, status: 'assigned' },
      { new: true }
    );

    if (!donation) {
      const existing = await Donation.findById(donationId);
      if (!existing) return res.status(404).json({ success: false, message: 'Donation not found' });
      if (existing.assignedVolunteerId) return res.status(400).json({ success: false, message: 'Task already assigned to another volunteer' });
      return res.status(400).json({ success: false, message: `Donation is in status "${existing.status}" and not available for pickup` });
    }
    
    console.log(`[TASK] Accept: ${donationId} by ${req.user.name}`);

    const task = await Task.create({
      donationId,
      volunteerId: req.user._id,
      status: 'assigned',
      pickupAddress: donation.location.address,
      deliveryAddress: 'Service Center',
      destinationType: 'center',
      destinationId: donation.assignedCenterId,
      acceptedAt: new Date(),
    });

    const populated = await task.populate([
      { path: 'donationId', populate: [
        { path: 'donorId', select: 'name phone' },
        { path: 'assignedCenterId', select: 'name location contact' }
      ]},
      { path: 'volunteerId', select: 'name phone' },
    ]);

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error(`[TASK] Accept Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/tasks - Get volunteer's tasks
router.get('/', protect, authorize('volunteer', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'volunteer' ? { volunteerId: req.user._id } : {};
    const tasks = await Task.find(filter)
      .populate({ 
        path: 'donationId', 
        populate: [
          { path: 'donorId', select: 'name phone email' },
          { path: 'assignedCenterId', select: 'name location contact' }
        ] 
      })
      .populate('volunteerId', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (err) {
    console.error(`[TASK] Get Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/tasks/:id/update - Update task status
router.patch('/:id/update', protect, authorize('volunteer'), async (req, res) => {
  try {
    const { status, deliveryProof } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const validTransitions = {
      assigned: ['collected'],
      collected: ['delivered_to_center'],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${task.status} to ${status}` });
    }

    task.status = status;
    if (status === 'collected') task.collectedAt = new Date();
    if (status === 'delivered_to_center') {
      task.deliveredAt = new Date();
      if (deliveryProof) task.deliveryProof = deliveryProof;
    }
    await task.save();

    // Update donation status + timeline
    const donationStatus = status === 'collected' ? 'collected' : 'delivered_to_center';
    const donation = await Donation.findById(task.donationId);
    if (donation) {
      donation.status = donationStatus;
      if (status === 'delivered_to_center') {
        donation.deliveredAt = new Date();
        donation.deliveredToCenterAt = new Date();
        if (deliveryProof) donation.deliveryProof = deliveryProof;
      }
      donation.statusTimeline = donation.statusTimeline || [];
      donation.statusTimeline.push({ status: donationStatus, at: new Date(), by: req.user._id });
      await donation.save();
    }

    // Award volunteer points on delivery
    if (status === 'delivered_to_center') {
      await User.findByIdAndUpdate(req.user._id, { $inc: { volunteerPoints: 10 } });
    }

    console.log(`[TASK] Status Update: ${task.id} to ${status}`);
    res.json({ success: true, data: task });
  } catch (err) {
    console.error(`[TASK] Update Error: ${err.message}`);
    res.status(400).json({ success: false, message: err.message });
  }
});

// GET /api/tasks/leaderboard - Top volunteers by points
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const leaders = await User.find({ role: 'volunteer' })
      .select('name volunteerPoints verificationStatus')
      .sort({ volunteerPoints: -1 })
      .limit(10);
    res.json({ success: true, data: leaders });
  } catch (err) {
    console.error(`[TASK] Leaderboard Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
