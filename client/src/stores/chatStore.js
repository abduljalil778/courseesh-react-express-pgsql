// src/stores/chatStore.js
import { create } from 'zustand';
import { getMyConversations, getMessagesByConversationId, markConversationAsRead } from '../lib/api';

export const useChatStore = create((set, get) => ({
  conversations: [],
  messages: [],
  activeConversationId: null,
  isLoadingConversations: true,
  isLoadingMessages: false,

  // Mengambil daftar semua percakapan
  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const response = await getMyConversations();
      const conversationsData = await Promise.all(
        (response.data.data || []).map(async c => ({
          ...c,
          unreadCount: await c.unreadCount
        }))
      );
      set({ conversations: conversationsData, isLoadingConversations: false });
    } catch (error) {
      console.error("Failed to fetch conversations", error);
      set({ isLoadingConversations: false });
    }
  },

  // Mengambil pesan untuk percakapan yang aktif
  fetchMessages: async (conversationId) => {
    if (!conversationId) return set({ messages: [] });
    set({ isLoadingMessages: true, messages: [] });
    try {
      const response = await getMessagesByConversationId(conversationId);
      set({ messages: response.data.data || [], isLoadingMessages: false });
    } catch (error) {
      console.error("Failed to fetch messages", error);
      set({ isLoadingMessages: false });
    }
  },

  // Menandai percakapan sudah dibaca
  markAsRead: async (conversationId) => {
    const currentConvo = get().conversations.find(c => c.conversationId === conversationId);
    if (!currentConvo || currentConvo.unreadCount === 0) return;

    set(state => ({
      conversations: state.conversations.map(c => 
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      )
    }));
    
    // Kirim request ke backend
    try {
      await markConversationAsRead(conversationId);
    } catch (error) {
      console.error("Failed to mark conversation as read:", error);
    }
  },

  setMessages: (messages) => set({ messages }),
  
  // Menambahkan pesan baru yang diterima secara real-time
  addLiveMessage: (message) => {
    set(state => {
      // Hanya tambahkan jika itu adalah percakapan yang sedang aktif
      if (message.conversationId === state.activeConversationId) {
        return { messages: [...state.messages, message] };
      } else {
        // Jika tidak aktif, update unread count di daftar percakapan
        return {
          conversations: state.conversations.map(c => 
            c.conversationId === message.conversationId 
              ? { ...c, unreadCount: (c.unreadCount || 0) + 1, lastMessage: message }
              : c
          )
        };
      }
    });
  },

  // Mengatur percakapan mana yang sedang aktif
  setActiveConversationId: (conversationId) => set({ activeConversationId: conversationId }),

  // Fungsi untuk membersihkan pesan saat komponen unmount
  clearMessages: () => set({ messages: [] }),
}));