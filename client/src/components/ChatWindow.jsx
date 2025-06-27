// src/components/ChatWindow.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { getMessagesByConversationId } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import Spinner from './Spinner';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

// `booking` prop berisi data booking untuk mendapatkan conversationId
export default function ChatWindow({ conversationId }) {
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    
    // Gunakan conversationId dari booking untuk hook chat
    const { messages, setMessages, sendMessage } = useChat(conversationId);
    const messagesEndRef = useRef(null);

    // Fetch riwayat chat saat komponen dibuka
    useEffect(() => {
        if (!conversationId) {
            setIsLoadingHistory(false);
            setMessages([{content: "Ruang chat akan aktif setelah guru mengkonfirmasi pesanan ini."}]);
            return;
        }
        setIsLoadingHistory(true);
        getMessagesByConversationId(conversationId)
            .then(res => {
                setMessages(res.data.data || []);
            })
            .catch(err => console.error("Failed to load messages", err))
            .finally(() => setIsLoadingHistory(false));
    }, [conversationId, setMessages]);
    
    // Auto-scroll ke pesan terbaru
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            sendMessage(newMessage);
            setNewMessage('');
        }
    };

    return (
        <div className="flex flex-col h-[60vh] bg-white">
            <div className="flex-grow p-4 overflow-y-auto">
                {isLoadingHistory ? <div className="flex justify-center items-center h-full"><Spinner /></div> : (
                    messages.map((msg, index) => (
                        <div key={msg.id || index} className={`flex items-end my-3 gap-3 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
                             <Avatar className="h-8 w-8">
                                <AvatarImage src={msg.sender?.avatarUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${msg.sender.avatarUrl}` : ''} />
                                <AvatarFallback>{msg.sender?.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.senderId === user.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                <p className="text-sm">{msg.content}</p>
                                {msg.createdAt && <p className="text-xs opacity-70 mt-1 text-right">{format(new Date(msg.createdAt), 'HH:mm')}</p>}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t flex gap-2 bg-gray-50">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Ketik pesan..." disabled={!conversationId} />
                <Button type="submit" disabled={!conversationId}><Send className="h-4 w-4" /></Button>
            </form>
        </div>
    );
}