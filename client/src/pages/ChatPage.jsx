// src/pages/ChatPage.jsx
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../stores/chatStore';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import { MessageSquare } from 'lucide-react';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { setActiveConversationId, conversations, fetchConversations } = useChatStore();
  const navigate = useNavigate()

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    setActiveConversationId(conversationId);
  }, [conversationId, setActiveConversationId]);

  const activeConversation = conversations.find(c => c.conversationId === conversationId);

  return (
    <>
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Button onClick={() => navigate('/student')} variant='ghost'>
            Home
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <BreadcrumbPage>
            Chat
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div className="flex h-[calc(100vh-120px)] border rounded-lg bg-white overflow-hidden dark:bg-gray-900 dark:border-gray-800">

      {/* KOLOM KIRI: SIDEBAR PERCAKAPAN */}
      <aside className="w-full md:w-[320px] lg:w-[380px] border-r dark:border-gray-700 flex-shrink-0 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
          <h1 className="text-xl font-bold">Pesan</h1>
        </div>
        <div className="overflow-y-auto">
          <ConversationList />
        </div>
      </aside>

      {/* KOLOM KANAN: JENDELA CHAT AKTIF */}
      <main className="flex-1 flex-col hidden md:flex">
        {conversationId && activeConversation ? (
          <ChatWindow 
            conversationId={conversationId} 
            otherUserName={activeConversation.otherUser.name}
            courseTitle={activeConversation.courseTitle}
            heightClass='h-full'
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground bg-gray-50 dark:bg-gray-800/50">
            <MessageSquare className="h-16 w-16 mb-4 text-gray-400" />
            <h2 className="text-lg font-semibold">Pilih percakapan</h2>
            <p className="max-w-xs text-sm">Pilih salah satu percakapan dari daftar untuk memulai.</p>
          </div>
        )}
      </main>
    </div>
    </>
  );
}