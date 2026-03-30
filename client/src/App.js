import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/donor/DonorDashboard';
import CreateDonation from './pages/donor/CreateDonation';
import MyDonations from './pages/donor/MyDonations';
import DonationDetail from './pages/DonationDetail';
import FundingPage from './pages/donor/FundingPage';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import AvailablePickups from './pages/volunteer/AvailablePickups';
import MyTasks from './pages/volunteer/MyTasks';
import CenterDashboard from './pages/center/CenterDashboard';
import CenterNeeds from './pages/center/CenterNeeds';
import CenterDonations from './pages/center/CenterDonations';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCenters from './pages/admin/AdminCenters';
import AdminDonations from './pages/admin/AdminDonations';

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  const routes = { donor: '/donor', volunteer: '/volunteer', service_center: '/center', admin: '/admin' };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#13163a', color: '#f0f0ff', border: '1px solid rgba(255,255,255,0.08)' },
          success: { iconTheme: { primary: '#10b981', secondary: '#f0f0ff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f0f0ff' } },
        }} />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute><RoleRedirect /></PrivateRoute>} />

          {/* Donor Routes */}
          <Route path="/donor" element={<PrivateRoute roles={['donor']}><DonorDashboard /></PrivateRoute>} />
          <Route path="/donor/donate" element={<PrivateRoute roles={['donor']}><CreateDonation /></PrivateRoute>} />
          <Route path="/donor/my-donations" element={<PrivateRoute roles={['donor']}><MyDonations /></PrivateRoute>} />
          <Route path="/donor/funding" element={<PrivateRoute roles={['donor']}><FundingPage /></PrivateRoute>} />

          {/* Volunteer Routes */}
          <Route path="/volunteer" element={<PrivateRoute roles={['volunteer']}><VolunteerDashboard /></PrivateRoute>} />
          <Route path="/volunteer/pickups" element={<PrivateRoute roles={['volunteer']}><AvailablePickups /></PrivateRoute>} />
          <Route path="/volunteer/tasks" element={<PrivateRoute roles={['volunteer']}><MyTasks /></PrivateRoute>} />

          {/* Service Center Routes */}
          <Route path="/center" element={<PrivateRoute roles={['service_center']}><CenterDashboard /></PrivateRoute>} />
          <Route path="/center/needs" element={<PrivateRoute roles={['service_center']}><CenterNeeds /></PrivateRoute>} />
          <Route path="/center/donations" element={<PrivateRoute roles={['service_center']}><CenterDonations /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><AdminUsers /></PrivateRoute>} />
          <Route path="/admin/centers" element={<PrivateRoute roles={['admin']}><AdminCenters /></PrivateRoute>} />
          <Route path="/admin/donations" element={<PrivateRoute roles={['admin']}><AdminDonations /></PrivateRoute>} />

          {/* Shared */}
          <Route path="/donations/:id" element={<PrivateRoute><DonationDetail /></PrivateRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
