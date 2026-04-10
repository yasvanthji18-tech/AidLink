const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const taskRoutes = require('./routes/tasks');
const centerRoutes = require('./routes/centers');
const fundingRoutes = require('./routes/funding');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/funding', fundingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'AidLink API is running' } }));

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[SERVER ERROR] ${status} - ${err.message}\n${err.stack}`);
  res.status(status).json({ success: false, message: err.message || 'Internal Server Error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 AidLink server running on port ${PORT}`));
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));
