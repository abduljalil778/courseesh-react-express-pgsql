// src/stores/notificationStore.js
import { create } from 'zustand';
import { getNotifications, markNotificationsAsRead } from '../lib/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // Aksi untuk mengambil notifikasi awal dari server
  fetchNotifications: async () => {
    try {
      const response = await getNotifications();
      const fetchedNotifications = response.data.data || [];
      set({
        notifications: fetchedNotifications,
        unreadCount: fetchedNotifications.filter(n => !n.isRead).length,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  },

  // Aksi yang dipanggil oleh Socket.IO saat ada notifikasi baru
  addNotification: (newNotification) => {
    set(state => ({
      // Tambahkan notifikasi baru di paling atas daftar
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Aksi untuk menandai semua notifikasi sebagai sudah dibaca
  markAllAsRead: async () => {
    // Hanya jalankan jika ada notifikasi yang belum dibaca
    if (get().unreadCount === 0) return;

    // Reset count di UI secara optimis agar responsif
    set({ unreadCount: 0 });
    
    // Tandai semua notifikasi di state sebagai sudah dibaca
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    }));
    
    try {
      // Kirim permintaan ke backend untuk update database
      await markNotificationsAsRead(); 
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      // Jika gagal, Anda bisa mengembalikan state ke semula (opsional)
    }
  },
}));