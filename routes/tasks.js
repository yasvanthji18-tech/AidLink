const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Donation = require('../models/Donation');
const { protect, authorize } = require('../middleware/auth');

// POST /api/tasks/accept - Volunteer accepts a donation
router.post('/accept', protect, authorize('volunteer'), async (req, res) => {
  try {
    const { donationId } = req.body;
    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.status !== 'posted') {
      return res.status(400).json({ message: 'Donation is not available for pickup' });
    }

    const existingTask = await Task.findOne({ donationId, status: { $ne: 'cancelled' } });
    if (existingTask) return res.status(400).json({ message: 'Donation already has an assigned task' });

    const task = await Task.create({
      donationId,
      volunteerId: req.user._id,
      status: 'accepted',
      pickupAddress: donation.location.address,
      acceptedAt: new Date(),
    });

    donation.status = 'accepted';
    donation.assignedVolunteerId = req.user._id;
    await donation.save();

    const populated = await task.populate([
      { path: 'donationId', populate: { path: 'donorId', select: 'name phone' } },
      { path: 'volunteerId', select: 'name phone' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/tasks - Get volunteer's tasks
router.get('/', protect, authorize('volunteer', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'volunteer' ? { volunteerId: req.user._id } : {};
    const tasks = await Task.find(filter)
      .populate({ path: 'donationId', populate: { path: 'donorId', select: 'name phone email' } })
      .populate('volunteerId', 'name phone')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/tasks/:id/update - Update task status
router.patch('/:id/update', protect, authorize('volunteer'), async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.volunteerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const validTransitions = {
      accepted: ['collected'],
      collected: ['delivered'],
    };

    if (!validTransitions[task.status]?.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${task.status} to ${status}` });
    }

    task.status = status;
    if (status === 'collected') task.collectedAt = new Date();
    if (status === 'delivered') task.deliveredAt = new Date();
    await task.save();

    // Update donation status
    const donationStatus = status === 'collected' ? 'collected' : 'delivered';
    await Donation.findByIdAndUpdate(task.donationId, { status: donationStatus });

    res.json(task);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
