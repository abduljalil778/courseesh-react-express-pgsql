// src/pages/ChatPage.jsx (Contoh sederhana, bisa dikembangkan)
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '../hooks/useChat';
import { getMessagesByBookingId } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import Spinner from '@/components/Spinner';

// Asumsi bookingId sama dengan conversationId untuk sementara
export default function ChatPage() {
    const { bookingId } = useParams(); // atau conversationId
    const { user } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const { messages, setMessages, sendMessage } = useChat(bookingId);
    const messagesEndRef = useRef(null);

    // Fetch riwayat chat saat halaman dibuka
    useEffect(() => {
        setIsLoadingHistory(true);
        getMessagesByBookingId(bookingId)
            .then(res => {
                setMessages(res.data.data || []);
            })
            .catch(err => console.error("Failed to load messages", err))
            .finally(() => setIsLoadingHistory(false));
    }, [bookingId, setMessages]);
    
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
        <div className="flex flex-col h-[calc(100vh-100px)] bg-white rounded-lg shadow-md">
            <div className="p-4 border-b font-semibold">Chat Room</div>
            <div className="flex-grow p-4 overflow-y-auto">
                {isLoadingHistory ? <Spinner /> : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex my-2 ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`px-4 py-2 rounded-lg max-w-xs lg:max-w-md ${msg.senderId === user.id ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t flex gap-2">
                <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." />
                <Button type="submit"><Send className="h-4 w-4" /></Button>
            </form>
        </div>
    );
}