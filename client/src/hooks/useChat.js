// src/hooks/useChat.js
import { useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useChatStore } from '../stores/chatStore';

export const useChat = () => {
  const { user } = useAuth();
  const { addLiveMessage, activeConversationId } = useChatStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const newSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      query: { userId: user.id },
    });
    socketRef.current = newSocket;
    
    newSocket.on('receiveMessage', (message) => {
      addLiveMessage(message);
    });

    return () => { newSocket.disconnect(); };
  }, [user, addLiveMessage]);

  useEffect(() => {
    if (socketRef.current && activeConversationId) {
      socketRef.current.emit('joinChatRoom', activeConversationId);
    }
  }, [activeConversationId]);

  const sendMessage = useCallback((content) => {
    if (socketRef.current && content.trim() && activeConversationId) {
      const messagePayload = {
        conversationId: activeConversationId,
        content: content.trim(),
        senderId: user.id,
      };
      socketRef.current.emit('sendMessage', messagePayload);
    }
  }, [activeConversationId, user]);

  return { sendMessage };
};