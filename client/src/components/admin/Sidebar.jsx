// src/components/admin/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { name: 'Dashboard', to: '/admin', icon: 'fas fa-tachometer-alt', end: true },
  { name: 'Users', to: '/admin/users', icon: 'fas fa-users' },
  { name: 'Courses', to: '/admin/courses', icon: 'fas fa-book' },
  { name: 'Bookings', to: '/admin/bookings', icon: 'fas fa-calendar-check' },
  { name: 'Payments', to: '/admin/payments', icon: 'fas fa-credit-card' },
  { name: 'Payouts', to: '/admin/payouts', icon: 'fas fa-money-bill-wave' },
  { name: 'Payment Options', to: '/admin/payment-options', icon: 'fas fa-university' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const activeStyle = {
    backgroundColor: '#4338ca', // bg-indigo-700
    color: 'white',
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-800 text-gray-300 flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>
      <nav className="flex-grow p-2 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.name}
            to={link.to}
            end={link.end}
            style={({ isActive }) => (isActive ? activeStyle : undefined)}
            className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors"
          >
            <i className={`${link.icon} w-6 mr-3`}></i>
            <span>{link.name}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center px-3 py-2.5 rounded-md text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white transition-colors"
        >
          <i className="fas fa-sign-out-alt w-6 mr-3"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}