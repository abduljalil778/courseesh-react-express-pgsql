import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings } from '../lib/api';
import MyCourseCardSkeleton from '@/components/skeleton/MyCourseCardSkeleton';
import { format, parseISO } from 'date-fns';
import { BookOpenIcon, UserIcon, AcademicCapIcon, CalendarIcon } from '@heroicons/react/24/solid';
import BookingDisplayStatus from '@/components/BookingDisplayStatus';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function TeacherSchedules() {
  const [activeBookings, setActiveBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadActiveBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings();
      const relevantBookings = (response.data?.bookings || []).filter(
        booking => booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED'
      );
      setActiveBookings(relevantBookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load active bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveBookings();
  }, [loadActiveBookings]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button onClick={loadActiveBookings} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div>
      <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button onClick={() => navigate('/teacher')} variant='ghost'>Home</Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage>Daftar Kursus</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        {/* <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
          Jadwal Mengajar
        </h1> */}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Jika sedang loading, tampilkan 6 buah skeleton
            Array.from({ length: 6 }).map((_, index) => <MyCourseCardSkeleton key={index} />)
          ) : activeBookings.length === 0 ? (
            // Jika tidak loading dan tidak ada data, tampilkan pesan kosong
            <div className="col-span-full text-center py-10">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Anda belum memiliki jadwal mengajar aktif.
              </h3>
              <p className="mt-1 text-sm text-gray-500">Jadwal akan muncul di sini setelah Anda mengkonfirmasi permintaan booking.</p>
            </div>
          ) : (
            // Jika tidak loading dan ada data, tampilkan kartu kursus
            activeBookings.map(booking => {
                const completedSessions = booking.sessions?.filter(s => s.status === 'COMPLETED').length || 0;
                const totalSessions = booking.sessions?.length || 0;
                const status = BookingDisplayStatus(booking);

          return (
            <div
              key={booking.id}
              className="bg-white rounded-lg shadow-lg flex flex-col hover:shadow-xl transition-shadow duration-300 cursor-pointer border group"
              onClick={() => navigate(`/teacher/schedules/${booking.id}`)}
            >
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <Badge className={status.colorClass} variant={status.variant}>{status.text}</Badge>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                    <BookOpenIcon className="w-4 h-4" /> {booking.course?.title || 'N/A'}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-800 flex-grow truncate mb-2">
                  <span className="inline-flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-indigo-500" /> {booking.student?.name || '-'}
                  </span>
                </h2>
                <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Booked: {format(parseISO(booking.createdAt), 'dd MMM yyyy')}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0}%` }}
                    title={`${completedSessions} / ${totalSessions} sessions completed`}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mb-4 text-center">
                  {completedSessions} / {totalSessions} sessions completed
                </p>
                <div className="mt-auto text-center text-sm font-medium text-indigo-600 group-hover:underline">
                  View & Manage Schedule
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
