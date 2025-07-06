// src/stores/notificationStore.js
import { create } from 'zustand';
import { getNotifications, markNotificationsAsRead } from '../lib/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  unreadChatCount: 0,

  // Aksi untuk mengambil notifikasi awal dari server
  fetchNotifications: async () => {
    try {
      const response = await getNotifications();
      const fetchedNotifications = response.data.data || [];
      set({
        notifications: fetchedNotifications,
        unreadCount: fetchedNotifications.filter(n => !n.isRead && n.type !== 'NEW_MESSAGE').length,
        unreadChatCount: fetchedNotifications.filter(n => !n.isRead && n.type === 'NEW_MESSAGE').length,
      });
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  },

  // Aksi yang dipanggil oleh Socket.IO saat ada notifikasi baru
  addNotification: (newNotification) => {
    set(state => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: newNotification.type !== 'NEW_MESSAGE' ? state.unreadCount + 1 : state.unreadCount,
      unreadChatCount: newNotification.type === 'NEW_MESSAGE' ? state.unreadChatCount + 1 : state.unreadChatCount,
    }));
  },

  markAllGeneralAsRead: async () => {
    if (get().unreadCount === 0) return;

    const originalNotifications = get().notifications;
    
    set({
      unreadCount: 0,
      notifications: get().notifications.map(n => 
        n.type !== 'NEW_MESSAGE' ? { ...n, isRead: true } : n
      ),
    });
    
    try {
      await markNotificationsAsRead('GENERAL');
    } catch (error) {
      console.error("Failed to mark general notifications as read:", error);
      set({ notifications: originalNotifications, unreadCount: get().unreadCount });
    }
  },

  markChatAsRead: async () => {
    if (get().unreadChatCount === 0) return;
    
    const originalNotifications = get().notifications;

    set({ 
      unreadChatCount: 0,
      notifications: get().notifications.map(n => 
        n.type === 'NEW_MESSAGE' ? { ...n, isRead: true } : n
      )
    });
    
    try {
      await markNotificationsAsRead('NEW_MESSAGE');
    } catch (error) {
      console.error("Failed to mark chat notifications as read:", error);
      set({ notifications: originalNotifications, unreadChatCount: get().unreadChatCount });
    }
  },
}));