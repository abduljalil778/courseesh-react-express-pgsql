// src/components/ConversationList.jsx
import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChatStore } from '../stores/chatStore';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import Spinner from './Spinner';

export default function ConversationList() {
  const { conversations =[], isLoadingConversations, fetchConversations } = useChatStore();
  const { user } = useAuth();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (isLoadingConversations) {
    return <div className="p-4 text-center"><Spinner /></div>;
  }
  
  if (conversations.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada percakapan.</div>;
  }

  return (
    <nav className="flex flex-col">
      {conversations.map(conv => {
        // Tambahkan pengecekan untuk otherUser untuk keamanan
        if (!conv.otherUser) {
          return null; 
        }
        return (
          <NavLink
            key={conv.conversationId}
            to={`/${user.role.toLowerCase()}/chat/${conv.conversationId}`}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/50' : ''}`
            }
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={conv.otherUser.avatarUrl ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${conv.otherUser.avatarUrl}` : ''} />
              <AvatarFallback>{conv.otherUser.name?.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-grow overflow-hidden">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm truncate text-gray-800 dark:text-gray-100">{conv.otherUser.name}</p>
                {conv.lastMessage && (
                  <p className="text-xs text-muted-foreground shrink-0 ml-2">
                    {formatDistanceToNowStrict(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: localeID })}
                  </p>
                )}
              </div>
              <div className="flex justify-between items-start mt-1">
                <p className="text-xs text-muted-foreground truncate w-4/5">{conv.lastMessage?.content || 'Ketuk untuk memulai percakapan...'}</p>
                {conv.unreadCount > 0 && (
                  <span className="flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full h-5 w-5 shrink-0">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </NavLink>
        );
      })}
    </nav>
  );
}