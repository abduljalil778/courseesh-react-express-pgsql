// src/pages/MyCourseList.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings } from '../lib/api';
import MyCourseCardSkeleton from '@/components/skeleton/MyCourseCardSkeleton';
import BookingDisplayStatus from '@/components/BookingDisplayStatus';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';

export default function MyCoursesList() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings();
      setBookings(response.data?.bookings || []);
    } catch (err) {
      console.error('Failed to load my courses:', err);
      setError(err.response?.data?.message || 'Failed to load your courses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);


  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button onClick={loadBookings} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button onClick={() => navigate('/student')} variant='ghost'>Home</Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage>Daftar Kursus</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">Pembelajaran Saya</h1>
        {!isLoading && bookings.length === 0 && (
        <div className="text-center py-10">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Kamu belum mempunyai kursus berjalan.</h3>
          <button 
              onClick={() => navigate('/student')}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
              Browse Courses
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Jika sedang loading, tampilkan 6 buah skeleton
            Array.from({ length: 6 }).map((_, index) => <MyCourseCardSkeleton key={index} />)
          ) : (
            // tampilkan data kursus
            bookings.map(booking => {
              const displayStatus = BookingDisplayStatus(booking);
              const completedSessions = booking.sessions?.filter(s => s.status === 'COMPLETED').length || 0;
              const totalSessions = booking.sessions?.length || 0;

              return (
                <div 
                  key={booking.id} 
                  className="animate-fade-in bg-white rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/student/my-courses/${booking.id}`)}
                >
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                        <Badge className={displayStatus.colorClass} variant={displayStatus.variant}>{displayStatus.text}</Badge>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 leading-tight flex-grow line-clamp-2">
                        {booking.course?.title || 'N/A'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 mb-3">
                        Teacher: {booking.course?.teacher?.name || 'N/A'}
                    </p>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                      <div 
                          className="bg-green-600 h-2.5 rounded-full" 
                          style={{ width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%` }}
                          title={`${completedSessions} / ${totalSessions} sessions completed`}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-4 text-center">
                        {completedSessions} / {totalSessions} Sesi Selesai
                    </p>
                    
                    <div className="mt-auto text-center text-sm font-medium text-indigo-600">
                        Manage
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}