// src/components/NotificationList.jsx
import React, { useMemo } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export default function NotificationList() {
  const notifications = useNotificationStore(state => state.notifications);

  // Gunakan useMemo untuk memfilter notifikasi secara efisien
  const generalNotifications = useMemo(() => {
    return notifications.filter(n => n.type !== 'NEW_MESSAGE');
  }, [notifications]);

  if (generalNotifications.length === 0) {
    return <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>;
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {generalNotifications.map(n => (
        <Link 
          to={n.link || '#'} 
          key={n.id} 
          className={`block p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${!n.isRead ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}
        >
          <p className="text-sm text-gray-800 dark:text-gray-200">{n.content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: localeID })}
          </p>
        </Link>
      ))}
    </div>
  );
}