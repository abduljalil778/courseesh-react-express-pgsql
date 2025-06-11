// src/pages/admin/AdminDashboard.jsx
import React from 'react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Welcome, Admin!</h1>
      <p className="mt-2 text-gray-600">This is the main dashboard. You can add summary statistics here.</p>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Contoh Kartu Statistik */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">150</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700">Total Courses</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">42</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700">Active Bookings</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">78</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700">Pending Payouts</h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">12</p>
        </div>
      </div>
    </div>
  );
}