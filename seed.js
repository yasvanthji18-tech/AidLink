require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const ServiceCenter = require('./models/ServiceCenter');
const Donation = require('./models/Donation');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    User.deleteMany({}),
    ServiceCenter.deleteMany({}),
    Donation.deleteMany({}),
    require('./models/Task').deleteMany({}),
    require('./models/Funding').deleteMany({}),
    require('./models/SystemSetting').deleteMany({}),
  ]);
  console.log('Cleared collections');

  // Create service centers
  let center1, center2, center3;
  try {
    center1 = await ServiceCenter.create({
      name: 'Hope Foundation',
      type: 'ngo',
      description: 'Providing food and shelter to underprivileged communities since 2010.',
      location: { address: '12 Gandhi Road', city: 'Mumbai', state: 'Maharashtra' },
      contact: { email: 'center@demo.com', phone: '9876543210', contactNumber: '9876543210' },
      needs: [
        { type: 'food', description: 'Cooked meals for 80 residents', quantity: '80 meals/day', urgency: 'critical' },
        { type: 'item', description: 'Winter clothes for elderly', quantity: '50 sets', urgency: 'high' },
      ],
      verified: true,
      verifiedAt: new Date(),
      capacity: 100,
      currentOccupancy: 80,
      totalDonationsReceived: 15000,
    });
    console.log('center1 created:', center1._id);
  } catch (e) { console.error('center1 failed:', e.message); process.exit(1); }

  try {
    center2 = await ServiceCenter.create({
      name: 'Rainbow Children Home',
      type: 'orphanage',
      description: 'A safe haven for 45 children aged 5-16 years.',
      location: { address: '47 Park Street', city: 'Bengaluru', state: 'Karnataka' },
      contact: { email: 'rainbow@demo.com', phone: '9123456780', contactNumber: '9123456780' },
      needs: [
        { type: 'item', description: 'School books and stationery', quantity: '50 sets', urgency: 'high' },
        { type: 'funding', description: 'Monthly operational support', quantity: '25000/month', urgency: 'medium' },
      ],
      verified: true,
      verifiedAt: new Date(),
      capacity: 60,
      currentOccupancy: 45,
      totalDonationsReceived: 8500,
    });
    console.log('center2 created:', center2._id);
  } catch (e) { console.error('center2 failed:', e.message); process.exit(1); }

  try {
    center3 = await ServiceCenter.create({
      name: 'Sunrise Old Age Home',
      type: 'old_age_home',
      description: 'Caring for 70 senior citizens with dignity.',
      location: { address: '8 Tree Lane', city: 'Chennai', state: 'Tamil Nadu' },
      contact: { email: 'sunrise@demo.com', contactNumber: '9333344445' },
      needs: [
        { type: 'food', description: 'Soft diet meals for elderly', quantity: '70 meals/day', urgency: 'high' },
      ],
      verified: true,
      verifiedAt: new Date(),
      capacity: 80,
      currentOccupancy: 70,
    });
    console.log('center3 created:', center3._id);
  } catch (e) { console.error('center3 failed:', e.message); process.exit(1); }

  // Create users
  let adminUser, donorUser, volunteerUser, centerUser, centerUser2, centerUser3;
  try {
    adminUser = await User.create({ name: 'Admin', email: 'admin@demo.com', passwordHash: 'demo1234', role: 'admin', phone: '9000000000', location: { address: 'Admin Office', city: 'Mumbai' }, isActive: true });
    console.log('adminUser created:', adminUser._id);
  } catch (e) { console.error('adminUser failed:', e.message); process.exit(1); }

  try {
    donorUser = await User.create({ name: 'Rahul Sharma', email: 'donor@demo.com', passwordHash: 'demo1234', role: 'donor', phone: '9988776655', location: { address: '5 Main Street', city: 'Mumbai', state: 'Maharashtra' }, isActive: true });
    console.log('donorUser created:', donorUser._id);
  } catch (e) { console.error('donorUser failed:', e.message); process.exit(1); }

  try {
    volunteerUser = await User.create({ name: 'Priya Volunteer', email: 'volunteer@demo.com', passwordHash: 'demo1234', role: 'volunteer', phone: '9876501234', location: { address: 'Volunteer Area', city: 'Mumbai' }, isActive: true });
    console.log('volunteerUser created:', volunteerUser._id);
  } catch (e) { console.error('volunteerUser failed:', e.message); process.exit(1); }

  try {
    centerUser = await User.create({ name: 'Hope Admin', email: 'center@demo.com', passwordHash: 'demo1234', role: 'service_center', phone: '9876543210', location: { address: '12 Gandhi Road', city: 'Mumbai' }, serviceCenterId: center1._id, isActive: true });
    console.log('centerUser created:', centerUser._id);
  } catch (e) { console.error('centerUser failed:', e.message); process.exit(1); }

  try {
    centerUser2 = await User.create({ name: 'Rainbow Admin', email: 'rainbow@demo.com', passwordHash: 'demo1234', role: 'service_center', phone: '9123456780', location: { address: '47 Park Street', city: 'Bengaluru' }, serviceCenterId: center2._id, isActive: true });
    console.log('centerUser2 created:', centerUser2._id);
  } catch (e) { console.error('centerUser2 failed:', e.message); process.exit(1); }

  try {
    centerUser3 = await User.create({ name: 'Sunrise Admin', email: 'sunrise@demo.com', passwordHash: 'demo1234', role: 'service_center', phone: '9333344445', location: { address: '8 Tree Lane', city: 'Chennai' }, serviceCenterId: center3._id, isActive: true });
    console.log('centerUser3 created:', centerUser3._id);
  } catch (e) { console.error('centerUser3 failed:', e.message); process.exit(1); }

  center1.managerId = centerUser._id;
  await center1.save();
  console.log('center1 manager linked');

  center2.managerId = centerUser2._id;
  await center2.save();
  console.log('center2 manager linked');

  center3.managerId = centerUser3._id;
  await center3.save();
  console.log('center3 manager linked');

  // No initial donations as per user request for clean state
  console.log('\n✅ Collections cleared and demo accounts seeded.');

  console.log('\n✅ Seed complete!');
  console.log('\nDemo Login Credentials:');
  console.log('  Admin:     admin@demo.com / demo1234');
  console.log('  Donor:     donor@demo.com / demo1234');
  console.log('  Volunteer: volunteer@demo.com / demo1234');
  console.log('  Center 1 (Hope Foundation):        center@demo.com / demo1234');
  console.log('  Center 2 (Rainbow Children Home):  rainbow@demo.com / demo1234');
  console.log('  Center 3 (Sunrise Old Age Home):   sunrise@demo.com / demo1234');
  process.exit(0);
}

seed().catch(err => { console.error('Unhandled seed error:', err.message, '\n', err.stack); process.exit(1); });
