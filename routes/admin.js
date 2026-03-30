const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const ServiceCenter = require('../models/ServiceCenter');
const Task = require('../models/Task');
const Funding = require('../models/Funding');
const { protect, authorize } = require('../middleware/auth');

// GET /api/admin/dashboard - Platform statistics
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, totalDonations, totalCenters, verifiedCenters, totalTasks, totalFunding] =
      await Promise.all([
        User.countDocuments(),
        Donation.countDocuments(),
        ServiceCenter.countDocuments(),
        ServiceCenter.countDocuments({ verified: true }),
        Task.countDocuments(),
        Funding.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      ]);

    const donationsByType = await Donation.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const donationsByStatus = await Donation.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    res.json({
      totalUsers,
      totalDonations,
      totalCenters,
      verifiedCenters,
      totalTasks,
      totalFundingAmount: totalFunding[0]?.total || 0,
      donationsByType,
      donationsByStatus,
      usersByRole,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/users - All users
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/users/:id/toggle - Toggle user active status
router.patch('/users/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/admin/verify-center - Verify a service center
router.patch('/verify-center', protect, authorize('admin'), async (req, res) => {
  try {
    const { centerId, verified } = req.body;
    const center = await ServiceCenter.findByIdAndUpdate(
      centerId,
      { verified, verifiedAt: verified ? new Date() : null },
      { new: true }
    );
    if (!center) return res.status(404).json({ message: 'Service center not found' });
    res.json(center);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/admin/donations - All donations
router.get('/donations', protect, authorize('admin'), async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donorId', 'name email')
      .populate('assignedVolunteerId', 'name')
      .populate('assignedCenterId', 'name')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
