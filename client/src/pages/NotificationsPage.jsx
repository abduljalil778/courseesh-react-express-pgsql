// src/pages/NotificationsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getNotifications } from '../lib/api';
import Spinner from '../components/Spinner';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// Komponen untuk satu item notifikasi
const NotificationItem = ({ notification }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => notification.link && navigate(notification.link)}
      className={`p-4 flex items-start gap-4 border-b last:border-b-0 ${notification.link ? 'cursor-pointer hover:bg-gray-50' : ''}`}
    >
      <div className={`mt-1 h-2.5 w-2.5 rounded-full ${!notification.isRead ? 'bg-indigo-500' : 'bg-gray-300'}`} />
      <div className="flex-grow">
        <p className="text-sm text-gray-800">{notification.content}</p>
        <p className="text-xs text-muted-foreground mt-1">{format(parseISO(notification.createdAt), 'dd MMMM yyyy, HH:mm')}</p>
      </div>
    </div>
  );
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const loadNotifications = useCallback(async (pageNum) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getNotifications({ page: pageNum, limit: 15 });
      setNotifications(res.data.data);
      setPageInfo({
        page: res.data.page,
        totalPages: res.data.totalPages,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications(1);
  }, [loadNotifications]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pageInfo.totalPages) {
      loadNotifications(newPage);
    }
  };
  
  return (
    <>
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Button onClick={() => navigate('/student') } variant='ghost'>
            Home
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <BreadcrumbPage>Notifications</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Notifikasi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center"><Spinner /></div>
          ) : error ? (
            <p className="p-6 text-center text-red-500">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="p-10 text-center text-muted-foreground">You don't have any notifications yet.</p>
          ) : (
            <div>
              {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
            </div>
          )}
        </CardContent>
        {pageInfo.totalPages > 1 && (
          <CardFooter className="flex justify-between items-center pt-4">
            <Button 
              variant="outline"
              onClick={() => handlePageChange(pageInfo.page - 1)}
              disabled={pageInfo.page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {pageInfo.page} of {pageInfo.totalPages}
            </span>
            <Button 
              variant="outline"
              onClick={() => handlePageChange(pageInfo.page + 1)}
              disabled={pageInfo.page >= pageInfo.totalPages}
            >
              Next
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
    </>
  );
}