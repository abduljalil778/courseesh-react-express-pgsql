// src/pages/TeacherBookingRequests.jsx (Rename dari TeacherBookings.jsx)
import React, { useEffect, useState, useCallback } from 'react';
import { getAllBookings, updateBooking } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';


export default function TeacherBookingRequests() {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPendingBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings(); // Backend filter untuk teacher
      const filtered = (response.data?.bookings || []).filter(b => b.bookingStatus === 'PENDING');
      setPendingBookings(filtered);
    } catch (err) {
      console.error('Could not load pending bookings:', err);
      setError(err.response?.data?.message || 'Could not load booking requests.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPendingBookings();
  }, [loadPendingBookings]);

  const handleUpdateBookingStatus = async (bookingId, newStatus, actionVerb = "update") => {
     if (newStatus === 'CANCELLED' || newStatus === 'CONFIRMED') { // Konfirmasi untuk aksi penting
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${actionVerb} this booking to ${newStatus}?`,
            icon: newStatus === 'CANCELLED' ? "warning" : "question",
            showCancelButton: true,
            confirmButtonColor: newStatus === 'CANCELLED' ? "#d33" : "#3085d6",
            cancelButtonColor: newStatus === 'CANCELLED' ? "#3085d6" : "#aaa",
            confirmButtonText: `Yes, ${actionVerb} it!`,
        });
        if (!result.isConfirmed) return;
    }
    try {
      await updateBooking(bookingId, { bookingStatus: newStatus });
      Swal.fire('Status Updated!', `Booking has been ${newStatus.toLowerCase()}.`, 'success');
      loadPendingBookings();
    } catch (err) {
      Swal.fire('Update Failed', err.response?.data?.message || `Could not ${actionVerb} booking status.`, 'error');
    }
  };
  
  const getBookingDisplayStatus = (booking) => {
    const hasPaidPayment = booking.payments.some(p => p.status === 'PAID');
    if (booking.bookingStatus === 'PENDING') {
      if (!hasPaidPayment) {
        return { text: 'Waiting for Payment', colorClass: 'text-orange-700 bg-orange-100' };
      }
      return { text: 'Waiting for Confirmation', colorClass: 'text-yellow-700 bg-yellow-100' };
    }
    switch (booking.bookingStatus) {
      case 'CONFIRMED': return { text: 'On Going', colorClass: 'text-green-700 bg-green-100' };
      case 'COMPLETED': return { text: 'Completed', colorClass: 'text-blue-700 bg-blue-100' };
      case 'CANCELLED': return { text: 'Cancelled', colorClass: 'text-red-700 bg-red-100' };
      default: return { text: booking.bookingStatus, colorClass: 'text-gray-700 bg-gray-100' };
    }
  };

  // --- UI Rendering ---
  if (isLoading) {
    return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Spinner size={60} />
          </div>
        );
  }
  if (error) { /* ... error message ... */ }

  if (pendingBookings.length === 0 && !isLoading ) {
    return (
        <div className="text-center py-10">
            {/* ... SVG ikon ... */}
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Pending Booking Requests</h3>
            <p className="mt-1 text-sm text-gray-500">You have no new student booking requests at this time.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
        Pending Booking Requests
      </h1>
      <div className="space-y-6">
        {pendingBookings.map(booking => {
          const displayStatus = getBookingDisplayStatus(booking);
          return (
            <div key={booking.id} className="bg-white shadow-lg rounded-xl p-5 md:p-6">
              <div className="md:flex md:justify-between md:items-start mb-3">
                  <div>
                      <h2 className="text-lg md:text-xl font-semibold text-indigo-700">
                          {booking.course?.title || 'N/A'}
                      </h2>
                      <p className="text-sm text-gray-600">
                          Student: <span className="font-medium">{booking.student?.name || 'N/A'}</span> ({booking.student?.email || 'N/A'})
                      </p>
                      <p className="text-xs text-gray-500">Booked on: {format(parseISO(booking.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                  <div className="mt-3 md:mt-0 md:text-right">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${displayStatus.colorClass}`}>
                          {displayStatus.text}
                      </span>
                  </div>
              </div>
              <div className="mb-3 text-sm text-gray-600">
                  <strong>Session Dates Requested:</strong> 
                  {booking.sessions?.length > 0 ? booking.sessions.map(s => format(parseISO(s.sessionDate), 'dd MMM yy')).join(', ') : 'N/A'}
              </div>
               <div className="mb-4 text-sm text-gray-600">
                  <strong>Student Address:</strong> {booking.address}
              </div>
              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                  <button
                      onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED', "confirm")}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  >
                      Confirm Booking
                  </button>
                  <button
                      onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED', "cancel")}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                      Cancel Booking
                  </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}