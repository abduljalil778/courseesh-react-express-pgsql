// src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Pastikan URL tidak mengandung path /api
      const socketUrl = import.meta.env.VITE_API_URL.replace('/api', '');
      
      const newSocket = io(socketUrl, {
        query: { userId: user.id },
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  // ======================================================
  // PERBAIKAN DI SINI: Ganti [user] menjadi [user?.id]
  // ======================================================
  }, [user?.id]); // Gunakan user.id yang merupakan string stabil

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};