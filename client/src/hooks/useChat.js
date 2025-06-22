// src/hooks/useChat.js
import { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export const useChat = (conversationId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    // Jangan buat koneksi jika tidak ada user atau ID percakapan
    if (!user || !conversationId) return;

    // Inisialisasi koneksi socket
    const newSocket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      query: { userId: user.id },
    });
    socketRef.current = newSocket;

    newSocket.emit('joinChatRoom', conversationId);

    // Mendengarkan pesan baru dari server
    newSocket.on('receiveMessage', (receivedMessage) => {
      
      // Hanya tambahkan pesan ke state jika pengirimnya BUKAN user saat ini.
      // Pesan dari user saat ini sudah ditambahkan secara optimis oleh sendMessage.
      if (receivedMessage.senderId !== user.id) {
        setMessages((prevMessages) => [...prevMessages, receivedMessage]);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [conversationId, user]); // Efek ini akan berjalan lagi jika conversationId atau user berubah

  const sendMessage = useCallback((content) => {
    if (socketRef.current && content.trim()) {
      const messagePayload = {
        conversationId,
        content: content.trim(),
        senderId: user.id,
      };

      // Optimistic update: Langsung tampilkan pesan di UI pengirim
      const optimisticMessage = {
        ...messagePayload,
        id: `optimistic-${Date.now()}`, // ID sementara
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      socketRef.current.emit('sendMessage', messagePayload);
    }
  }, [conversationId, user]);

  return { messages, setMessages, sendMessage };
};