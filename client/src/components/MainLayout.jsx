// src/components/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import { SocketProvider } from '../context/SocketContext';
import NotificationHandler from './NotificationHandler';
import { Toaster } from 'react-hot-toast';
import { useNotificationStore } from '../stores/notificationStore';

export default function MainLayout() {
  const fetchNotifications = useNotificationStore(state => state.fetchNotifications);

  useEffect(() => {
    // Ambil notifikasi dari server saat layout ini pertama kali dimuat
    fetchNotifications();
  }, [fetchNotifications]);
  
  return (
    <SocketProvider>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <main>
          <NotificationHandler />
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Outlet /> 
          </div>
        </main>
      </div>
    </SocketProvider>
  );
} 