// // src/pages/ChatPage.jsx (Contoh sederhana, bisa dikembangkan)
// import React, { useState, useEffect, useRef } from 'react';
// import { useParams } from 'react-router-dom';
// import { useChat } from '../hooks/useChat';
// import { getMessagesByBookingId } from '../lib/api';
// import { useAuth } from '../context/AuthContext';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Send } from 'lucide-react';
// import Spinner from '@/components/Spinner';

// // Asumsi bookingId sama dengan conversationId untuk sementara
// export default function ChatPage() {
//     const { bookingId } = useParams(); // atau conversationId
//     const { user } = useAuth();
//     const [newMessage, setNewMessage] = useState('');
//     const [isLoadingHistory, setIsLoadingHistory] = useState(true);
//     const { messages, setMessages, sendMessage } = useChat(bookingId);
//     const messagesEndRef = useRef(null);

//     // Fetch riwayat chat saat halaman dibuka
//     useEffect(() => {
//         setIsLoadingHistory(true);
//         getMessagesByBookingId(bookingId)
//             .then(res => {
//                 setMessages(res.data.data || []);
//             })
//             .catch(err => console.error("Failed to load messages", err))
//             .finally(() => setIsLoadingHistory(false));
//     }, [bookingId, setMessages]);
    
//     // Auto-scroll ke pesan terbaru
//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [messages]);

//     const handleSend = (e) => {
//         e.preventDefault();
//         if (newMessage.trim()) {
//             sendMessage(newMessage);
//             setNewMessage('');
//         }
//     };

//     return (
//         <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-lg shadow-md">
//             <div className="p-4 border-b font-semibold">Chat Room</div>
//             <div className="flex-grow p-4 overflow-y-auto">
//                 {isLoadingHistory ? <Spinner /> : (
//                     messages.map((msg, index) => (
//                         <div key={index} className={`flex my-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
//                             <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.senderId === user.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
//                                 {msg.content}
//                             </div>
//                         </div>
//                     ))
//                 )}
//                 <div ref={messagesEndRef} />
//             </div>
//             <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
//                 <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." />
//                 <Button type="submit"><Send className="h-4 w-4" /></Button>
//             </form>
//         </div>
//     );
// }

// src/pages/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import ChatWindow from '../components/ChatWindow';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare } from 'lucide-react';
import { getMyConversations } from '../lib/api';
import Spinner from '../components/Spinner';

const ConversationList = () => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    getMyConversations()
      .then(res => {
        setConversations(res.data.data || []);
      })
      .catch(err => console.error("Failed to fetch conversations", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Loading chats...</div>;
  }

  return (
    <nav className="flex flex-col">
      {conversations.map(({ conversationId, otherUser, courseTitle }) => (
        <NavLink
          key={conversationId}
          to={`/${user.role.toLowerCase()}/chat/${conversationId}`}
          className={({ isActive }) =>
            `flex items-center gap-3 p-3 border-b hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''}`
          }
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser.avatarUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${otherUser.avatarUrl}` : ''} />
            <AvatarFallback>{otherUser.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-grow overflow-hidden">
            <p className="font-semibold text-sm truncate">{otherUser.name}</p>
            <p className="text-xs text-muted-foreground truncate">{courseTitle}</p>
          </div>
        </NavLink>
      ))}
    </nav>
  );
};


// Komponen Halaman Utama
export default function ChatPage() {
  const { conversationId } = useParams();

  return (
    <Card className="flex h-[calc(100vh-120px)] overflow-hidden">
      {/* Kolom Kiri: Daftar Percakapan */}
      <div className="w-full md:w-1/3 lg:w-1/4 border-r flex-shrink-0 overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Pesan</h1>
        </div>
        <ConversationList />
      </div>

      {/* Kolom Kanan: Jendela Chat Aktif */}
      <div className="flex-grow flex-col hidden md:flex">
        {conversationId ? (
          <ChatWindow conversationId={conversationId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-gray-50">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold">Pilih percakapan</h2>
            <p className="max-w-xs text-sm">Pilih salah satu percakapan dari daftar di sebelah kiri untuk memulai.</p>
          </div>
        )}
      </div>
    </Card>
  );
}