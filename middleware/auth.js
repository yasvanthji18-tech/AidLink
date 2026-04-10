const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash').populate('serviceCenterId');
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    
    // Debug Log
    console.log(`[AUTH] User ${req.user.name} (${req.user.role}) authenticated`);
    return next();
  } catch (err) {
    console.error(`[AUTH] Error: ${err.message}`);
    return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      console.warn(`[AUTH] Access denied for role: ${req.user.role}`);
      return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized` });
    }
    return next();
  };
};

module.exports = { protect, authorize };
