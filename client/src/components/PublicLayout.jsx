// src/pages/PublicLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="bg-gray-100 min-h-screen p-4 flex items-center justify-center">
      <Outlet />
    </div>
  );
}