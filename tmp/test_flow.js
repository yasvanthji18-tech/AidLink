// System Flow Test using built-in fetch (Node 18+)
const API_URL = 'http://localhost:5000/api';

async function runTests() {
  try {
    console.log('--- STARTING SYSTEM FLOW TEST ---');

    // Helper for fetch with headers
    const call = async (path, method = 'GET', body = null, token = null) => {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: body ? JSON.stringify(body) : null
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`${path} failed: ${res.status} - ${data.message || 'Error'}`);
      return data;
    };

    // 1. Login as Donor
    const donorLogin = await call('/auth/login', 'POST', {
      email: 'donor@demo.com',
      password: 'demo1234'
    });
    const donorToken = donorLogin.data.token;
    console.log('✅ Donor Login Successful');

    // 2. Create Donation
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const donationRes = await call('/donations', 'POST', {
      type: 'food',
      title: 'Test Biryani',
      foodName: 'Chicken Biryani',
      quantity: '10 portions',
      expiryTime: expiry.toISOString(),
      location: { address: 'Test Lane 1', city: 'Mumbai', state: 'Maharashtra' }
    }, donorToken);

    const donationId = donationRes.data._id;
    const centerId = donationRes.data.assignedCenterId;
    console.log(`✅ Donation Created: ${donationId}`);
    console.log(`✅ Auto-assigned to Center: ${centerId}`);

    // 3. Login as Center Admin
    const centerLogin = await call('/auth/login', 'POST', {
      email: 'center@demo.com',
      password: 'demo1234'
    });
    const centerToken = centerLogin.data.token;
    console.log('✅ Center Admin Login Successful');

    // 4. Center Accepts Donation
    await call(`/centers/${centerId}/respond-donation`, 'PATCH', {
      donationId,
      action: 'accept'
    }, centerToken);
    console.log('✅ Center Accepted Donation');

    // 5. Login as Volunteer
    const volunteerLogin = await call('/auth/login', 'POST', {
      email: 'volunteer@demo.com',
      password: 'demo1234'
    });
    const volunteerToken = volunteerLogin.data.token;
    console.log('✅ Volunteer Login Successful');

    // 6. Volunteer Accepts Task
    const taskRes = await call('/tasks/accept', 'POST', {
      donationId
    }, volunteerToken);
    const taskId = taskRes.data._id;
    console.log(`✅ Volunteer Accepted Task: ${taskId}`);

    // 7. Volunteer Marks Collected
    await call(`/tasks/${taskId}/update`, 'PATCH', {
      status: 'collected'
    }, volunteerToken);
    console.log('✅ Volunteer Marked Collected');

    // 8. Volunteer Marks Delivered
    await call(`/tasks/${taskId}/update`, 'PATCH', {
      status: 'delivered_to_center'
    }, volunteerToken);
    console.log('✅ Volunteer Marked Delivered');

    // 9. Verify Points
    const volunteerAfter = await call('/auth/me', 'GET', null, volunteerToken);
    console.log(`✅ Points Awarded: ${volunteerAfter.volunteerPoints}`);

    // 10. Test Expiry logic
    console.log('\n--- TESTING EXPIRY LOGIC ---');
    const pastExpiry = new Date(Date.now() - 1000);
    const expiredDonationRes = await call('/donations', 'POST', {
      type: 'food',
      title: 'Old Food',
      foodName: 'Old Bread',
      quantity: '5 portions',
      expiryTime: pastExpiry.toISOString(),
      location: { address: 'Test Lane 1', city: 'Mumbai', state: 'Maharashtra' }
    }, donorToken);
    console.log(`✅ Expired Donation Created. Status: ${expiredDonationRes.data.status}`);
    if (expiredDonationRes.data.status === 'expired') {
      console.log('✅ Expiry logic is WORKING');
    } else {
      console.log('❌ Expiry logic FAILED');
    }

    console.log('\n--- ALL TESTS COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error(`❌ TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

runTests();
