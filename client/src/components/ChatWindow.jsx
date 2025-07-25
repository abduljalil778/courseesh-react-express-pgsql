// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import Spinner from './Spinner';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export default function ChatWindow({ conversationId, otherUserName, courseTitle, heightClass = 'h-[75vh]' }) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const { messages, isLoadingMessages, fetchMessages, markAsRead, setActiveConversationId, clearMessages } = useChatStore();
  const { sendMessage } = useChat();

  useEffect(() => {
    setActiveConversationId(conversationId);
    if (conversationId) {
      fetchMessages(conversationId);
      markAsRead(conversationId);
    }

    return () => {
      setActiveConversationId(null);
      clearMessages(); // Bersihkan pesan saat komponen unmount
    };
  }, [conversationId, setActiveConversationId, fetchMessages, markAsRead, clearMessages]);
  
  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    // Auto-scroll ke pesan terbaru
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };
  
  return (
    <div className={`flex flex-col bg-white dark:bg-gray-900 ${heightClass}`}>
      <div className="p-4 border-b dark:border-gray-700 flex items-center gap-4 shrink-0">
        {/* <Avatar>
          <AvatarFallback>{otherUserName?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
        </Avatar> */}
        <div>
          <h3 className="font-semibold">{otherUserName}</h3>
          <p className="text-xs text-muted-foreground">{courseTitle}</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoadingMessages ? (
          <div className="flex justify-center items-center h-full"><Spinner /></div>
        ) : (
          messages.length > 0 ? messages.map((msg, index) => (
            <div key={msg.id || index} className={`flex items-end my-2 gap-2 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={msg.sender?.avatarUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${msg.sender.avatarUrl}` : ''} />
                <AvatarFallback>{msg.sender?.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] ${msg.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-bl-none'}`}>
                <p className="text-sm break-words">{msg.content}</p>
                <p className={`text-xs mt-1 text-right ${msg.senderId === user.id ? 'text-indigo-200' : 'text-gray-500'}`}>{format(new Date(msg.createdAt), 'HH:mm')}</p>
              </div>
            </div>
          )) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground">Mulai percakapan dengan instruktur Anda.</p>
             </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t dark:border-gray-700 flex gap-2 bg-gray-50 dark:bg-gray-900/50 shrink-0">
        <Input 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder="Ketik pesan..." 
          disabled={!conversationId} 
          className="bg-white dark:bg-gray-800"
        />
        <Button type="submit" disabled={!conversationId || !newMessage.trim()} size="icon" className="shrink-0">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}