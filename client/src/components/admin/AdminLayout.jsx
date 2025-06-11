// src/components/admin/AdminLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AdminLayout() {
  const location = useLocation();

  const getPageTitle = (pathname) => {
    if (pathname === '/admin') return 'Dashboard';
    const parts = pathname.split('/').filter(p => p);
    const title = (parts[1] || '').replace(/-/g, ' ');
    return title.charAt(0).toUpperCase() + title.slice(1);
  };
  
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-grow flex flex-col">
        <header className="bg-white shadow-sm h-16 flex items-center px-6 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-xl font-semibold text-gray-800">{pageTitle}</h1>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}