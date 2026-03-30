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
      contact: { email: 'center@demo.com', phone: '9876543210' },
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
      contact: { email: 'rainbow@demo.com', phone: '9123456780' },
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
      contact: { email: 'sunrise@demo.com' },
      needs: [
        { type: 'food', description: 'Soft diet meals for elderly', quantity: '70 meals/day', urgency: 'high' },
      ],
      verified: false,
      capacity: 80,
      currentOccupancy: 70,
    });
    console.log('center3 created:', center3._id);
  } catch (e) { console.error('center3 failed:', e.message); process.exit(1); }

  // Create users
  let adminUser, donorUser, volunteerUser, centerUser;
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

  center1.managerId = centerUser._id;
  await center1.save();
  console.log('center1 manager linked');

  // Create donations one by one
  const expiry = new Date(Date.now() + 4 * 60 * 60 * 1000);

  try {
    await Donation.create({
      donorId: donorUser._id, type: 'food', title: 'Fresh Biryani - 30 portions',
      description: 'Freshly cooked chicken biryani. Serves about 30 people.',
      foodName: 'Chicken Biryani', quantity: '30 portions',
      location: { address: '5 Main Street, Bandra', city: 'Mumbai', state: 'Maharashtra' },
      expiryTime: expiry, pickupTime: new Date(Date.now() + 1 * 60 * 60 * 1000),
      deliveryMode: 'volunteer_pickup', status: 'posted',
    });
    console.log('donation1 created');
  } catch (e) { console.error('donation1 failed:', e.message); process.exit(1); }

  try {
    await Donation.create({
      donorId: donorUser._id, type: 'item', title: 'Winter Clothes Bundle',
      description: 'Assorted warm clothes in good condition.',
      quantity: '2 large bags', condition: 'good', itemCategory: 'clothes',
      location: { address: '5 Main Street, Bandra', city: 'Mumbai', state: 'Maharashtra' },
      deliveryMode: 'self_drop', assignedCenterId: center1._id, status: 'accepted',
    });
    console.log('donation2 created');
  } catch (e) { console.error('donation2 failed:', e.message); process.exit(1); }

  try {
    await Donation.create({
      donorId: donorUser._id, type: 'food', title: 'Dal Rice - 50 plates',
      description: 'Hot dal rice prepared this morning.',
      foodName: 'Dal Rice', quantity: '50 plates',
      location: { address: '10 Baker Street', city: 'Mumbai' },
      expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      deliveryMode: 'volunteer_pickup', status: 'delivered',
      assignedVolunteerId: volunteerUser._id,
    });
    console.log('donation3 created');
  } catch (e) { console.error('donation3 failed:', e.message); process.exit(1); }

  try {
    await Donation.create({
      donorId: donorUser._id, type: 'item', title: 'School Books - Class 5-8',
      description: 'NCERT textbooks in good condition.',
      quantity: '30 books', condition: 'good', itemCategory: 'books',
      location: { address: '5 Main Street', city: 'Mumbai' },
      deliveryMode: 'volunteer_pickup', assignedCenterId: center2._id, status: 'posted',
    });
    console.log('donation4 created');
  } catch (e) { console.error('donation4 failed:', e.message); process.exit(1); }

  console.log('\n✅ Seed complete!');
  console.log('\nDemo Login Credentials:');
  console.log('  Admin:     admin@demo.com / demo1234');
  console.log('  Donor:     donor@demo.com / demo1234');
  console.log('  Volunteer: volunteer@demo.com / demo1234');
  console.log('  Center:    center@demo.com / demo1234');
  process.exit(0);
}

seed().catch(err => { console.error('Unhandled seed error:', err.message, '\n', err.stack); process.exit(1); });
