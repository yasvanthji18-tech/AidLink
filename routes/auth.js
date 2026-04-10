const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, centerName, centerType, centerDescription, centerPhone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password, and role are required' });
    }
    
    console.log(`[REGISTER] Attempt for: ${email}`);

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const user = new User({ name, email, passwordHash: password, role, phone, location });

    // If service_center role, create ServiceCenter record
    if (role === 'service_center') {
      const center = await ServiceCenter.create({
        name: centerName || name,
        type: centerType || 'ngo',
        description: centerDescription || '',
        location: {
          address: location?.address || 'Not provided',
          city: location?.city || '',
          state: location?.state || '',
          pincode: location?.pincode || '',
        },
        contact: {
          email,
          phone: centerPhone || phone || '',
          contactNumber: centerPhone || phone || 'Not provided',
        },
        managerId: null,
      });
      user.serviceCenterId = center._id;
      await user.save();
      center.managerId = user._id;
      await center.save();
    } else {
      await user.save();
    }

    const token = signToken(user._id);
    const responsePayload = { success: true, data: { token, user } };
    console.log(`[REGISTER] Success: ${user.name} - Sample: ${JSON.stringify(responsePayload).substring(0, 100)}...`);
    res.status(201).json(responsePayload);
  } catch (err) {
    console.error(`[REGISTER] Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    console.log(`[LOGIN] Success: ${user.name}`);
    res.json({ success: true, data: { token, user } });
  } catch (err) {
    console.error(`[LOGIN] Error: ${err.message}`);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
const { protect } = require('../middleware/auth');
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('serviceCenterId');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
