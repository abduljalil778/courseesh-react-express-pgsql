import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext'; // Impor useSocket
import { useAuth } from '../context/AuthContext';
import { useChatStore } from '../stores/chatStore';

export const useChat = () => {
  const { user } = useAuth();
  const { addLiveMessage, activeConversationId } = useChatStore();
  
  // Gunakan socket yang sudah ada dari context, jangan buat yang baru
  const socket = useSocket(); 

  useEffect(() => {
    // Pastikan socket sudah siap sebelum memasang listener
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      addLiveMessage(message);
    };

    // Pasang listener di socket yang ada
    socket.on('receiveMessage', handleReceiveMessage);

    // Fungsi cleanup untuk melepas listener saat komponen unmount
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, addLiveMessage]); // Listener akan diperbarui jika socket atau fungsi addLiveMessage berubah

  useEffect(() => {
    // Bergabung ke room chat saat conversationId aktif berubah
    if (socket && activeConversationId) {
      socket.emit('joinChatRoom', activeConversationId);
    }
  }, [socket, activeConversationId]);

  const sendMessage = useCallback((content) => {
    if (socket && content.trim() && activeConversationId) {
      const messagePayload = {
        conversationId: activeConversationId,
        content: content.trim(),
        senderId: user.id,
      };
      socket.emit('sendMessage', messagePayload);
    }
  }, [socket, activeConversationId, user?.id]);

  return { sendMessage };
};