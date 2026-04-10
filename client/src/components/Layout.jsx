import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Heart, Package, Users, Settings,
  LogOut, ChevronRight, Truck, Building2, Shield,
  PlusCircle, ListChecks, DollarSign, ClipboardList,
  Star, Inbox
} from 'lucide-react';

const navConfig = {
  donor: [
    { label: 'Dashboard', to: '/donor', icon: LayoutDashboard },
    { label: 'Make a Donation', to: '/donor/donate', icon: PlusCircle },
    { label: 'My Donations', to: '/donor/my-donations', icon: Heart },
    { label: 'Fund a Center', to: '/donor/funding', icon: DollarSign },
  ],
  volunteer: [
    { label: 'Dashboard', to: '/volunteer', icon: LayoutDashboard },
    { label: 'Available Pickups', to: '/volunteer/pickups', icon: Package },
    { label: 'My Tasks', to: '/volunteer/tasks', icon: ListChecks },
  ],
  service_center: [
    { label: 'Dashboard', to: '/center', icon: LayoutDashboard },
    { label: 'Our Needs', to: '/center/needs', icon: ClipboardList },
    { label: 'Incoming Donations', to: '/center/donations', icon: Inbox },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
    { label: 'Users', to: '/admin/users', icon: Users },
    { label: 'Service Centers', to: '/admin/centers', icon: Building2 },
    { label: 'Donations', to: '/admin/donations', icon: Package },
    { label: 'System Report', to: '/admin/report', icon: ClipboardList },
  ],
};

const roleLabels = {
  donor: 'Donor',
  volunteer: 'Volunteer',
  service_center: 'Service Center',
  admin: 'Administrator',
};

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">A</div>
          <span className="logo-text">AidLink</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Navigation</div>
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/donor' || item.to === '/volunteer' || item.to === '/center' || item.to === '/admin'}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout} title="Click to logout">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleLabels[user?.role]}</div>
            </div>
            <LogOut size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </div>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <h1 className="topbar-title">{title}</h1>
          <div className="topbar-right">
            <div className="chip">
              <Shield size={12} />
              {roleLabels[user?.role]}
            </div>
          </div>
        </div>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
