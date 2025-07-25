// src/components/NotificationHandler.jsx
import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { useNotificationStore } from '@/stores/notificationStore';

export default function NotificationHandler() {
  const socket = useSocket();
  // Ambil aksi `addNotification` dari store
  const addNotification = useNotificationStore(state => state.addNotification);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (data) => {
      toast.success(data.message || 'You have a new notification!');
      // Panggil aksi store untuk menambahkan notifikasi baru ke state global
      addNotification(data.notification); // Asumsi backend mengirim { message, notification }
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, addNotification]);

  return null;
}