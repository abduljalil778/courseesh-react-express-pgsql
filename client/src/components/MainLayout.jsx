// src/components/MainLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <div className="container mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}