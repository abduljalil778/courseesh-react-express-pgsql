// src/pages/TeacherBookingRequests.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getAllBookings, updateBooking } from '../lib/api';
import BookingCardSkeleton from '@/components/skeleton/BookingCardSkeleton';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BookingDisplayStatus from '@/components/BookingDisplayStatus';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


const TABS = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export default function TeacherBookingRequests() {
  const [allBookings, setAllBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStatus, setActiveStatus] = useState('ALL');

  const navigate = useNavigate()

  // fetch semua booking dari API
  const loadAllBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Panggil API untuk guru ini
      const response = await getAllBookings(); 
      // Simpan semua booking tanpa filter frontend
      setAllBookings(response.data?.bookings || []);
    } catch (err) {
      console.error('Could not load bookings:', err);
      setError(err.response?.data?.message || 'Could not load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllBookings();
  }, [loadAllBookings]);

  // untuk memfilter booking di sisi klien saat tab diganti
  const filteredBookings = useMemo(() => {
    if (activeStatus === 'ALL') {
      return allBookings;
    }
    return allBookings.filter(b => b.bookingStatus === activeStatus);
  }, [allBookings, activeStatus]);

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    const actionVerb = newStatus === 'CONFIRMED' ? 'confirm' : 'cancel';
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${actionVerb} this booking?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: newStatus === 'CANCELLED' ? "#d33" : "#3085d6",
      confirmButtonText: `Yes, ${actionVerb} it!`,
    });
    if (!result.isConfirmed) return;

    try {
      await updateBooking(bookingId, { bookingStatus: newStatus });
      Swal.fire('Status Updated!', `Booking has been ${newStatus.toLowerCase()}.`, 'success');
      loadAllBookings(); // Muat ulang semua booking
    } catch (err) {
      Swal.fire('Update Failed', err.response?.data?.message || 'Could not update booking status.', 'error');
    }
  };
  
  if (error) {
    return <div className="text-center py-16 text-red-600">{error}</div>;
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
              <BreadcrumbPage>Daftar Booking</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        </div>
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      {/* <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Bookings</h1>
      </div> */}

      {/* TAB FILTER */}
      <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {TABS.map(tab => (
              <Button variant='ghost' key={tab} onClick={() => setActiveStatus(tab)} className={`${
                activeStatus === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Button>
          ))}
        </nav>
      </div>

        <div className="space-y-6">
          {isLoading ? (
            // Jika sedang loading, tampilkan 3 buah skeleton
            Array.from({ length: 3 }).map((_, index) => <BookingCardSkeleton key={index} />)
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <h3 className="text-lg font-medium text-gray-900">No Bookings Found</h3>
              <p className="mt-1 text-sm text-gray-500">There are no bookings with the status "{activeStatus}".</p>
            </div>
          ) : (
            // tampilkan data booking 
            filteredBookings.map(booking => {
              const displayStatus = BookingDisplayStatus(booking);
              return (
                <Card key={booking.id} className="overflow-hidden">
                <CardHeader className="flex flex-row justify-between items-start bg-gray-50 p-4 md:p-5 border-b">
                  <div>
                    <CardTitle className="text-lg md:text-xl text-gray-800">{booking.course?.title || 'N/A'}</CardTitle>
                    <CardDescription className="mt-1">
                      From: {booking.student?.name || 'N/A'} ({booking.student?.email || 'N/A'})
                    </CardDescription>
                    <CardDescription className="text-xs mt-1">
                      Booked on: {format(parseISO(booking.createdAt), 'dd MMM yyyy, HH:mm')}
                    </CardDescription>
                  </div>
                  <Badge className={displayStatus.colorClass} variant={displayStatus.variant}>{displayStatus.text}</Badge>
                </CardHeader>
                <CardContent className="p-4 md:p-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Session Dates</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {booking.sessions?.length > 0 
                          ? booking.sessions.map(s => <li key={s.id}>{format(parseISO(s.sessionDate), 'eee, dd MMM yyyy @ HH:mm')}</li>) 
                          : <li>No sessions scheduled</li>
                        }
                      </ul>
                    </div>
                    <div>
                       <h4 className="font-semibold text-sm mb-2">Student Address</h4>
                       <p className="text-sm text-gray-600">{booking.address}</p>
                    </div>
                  </div>
                </CardContent>
                {/* TOMBOL AKSI */}
                {booking.bookingStatus === 'PENDING' && (
                  <CardFooter className="bg-gray-50 p-4 flex justify-end space-x-3">
                    <Button variant="destructive" size="sm" onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}>Cancel Booking</Button>
                    <Button variant="default" size="sm" onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}>Confirm Booking</Button>
                  </CardFooter>
                )}
               </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}