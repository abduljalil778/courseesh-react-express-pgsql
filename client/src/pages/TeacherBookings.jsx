// src/pages/TeacherBookings.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllBookings, updateBooking } from '../lib/api'; // updateBooking lebih generik
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';

// Komponen kecil untuk menampilkan detail cicilan (bisa dipakai ulang dari MyBookings)
const InstallmentDetailRow = ({ payment }) => (
  <div className={`text-xs px-2 py-1 my-0.5 rounded flex justify-between items-center ${payment.status === 'PAID' ? 'bg-green-100 text-green-700' : payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
    <span>Pay. {payment.installmentNumber}: {formatCurrencyIDR(payment.amount)}</span>
    <strong className="ml-2">{payment.status}</strong>
  </div>
);


export default function TeacherBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Backend getAllBookings akan otomatis filter untuk teacher yang login
      const response = await getAllBookings();
      setBookings(response.data || []);
    } catch (err) {
      console.error('Could not load bookings:', err);
      setError(err.response?.data?.message || 'Could not load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleUpdateStatus = async (bookingId, newStatus, actionVerb = "update") => {
    // Konfirmasi khusus untuk cancel
    if (newStatus === 'CANCELLED') {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${actionVerb} this booking to ${newStatus}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: `Yes, ${actionVerb} it!`,
        });
        if (!result.isConfirmed) return;
    }

    try {
      await updateBooking(bookingId, { bookingStatus: newStatus }); // Menggunakan updateBooking
      Swal.fire({
        title: 'Status Updated!',
        text: `Booking has been ${newStatus.toLowerCase()}.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      loadBookings(); // Muat ulang
    } catch (err) {
      console.error(`Could not ${actionVerb} booking:`, err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || `Could not ${actionVerb} booking status.`,
      });
    }
  };
  
  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-700 bg-green-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'CANCELLED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} />
      </div>
    );
  }

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

  if (bookings.length === 0) {
    return (
        <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Bookings Found</h3>
            <p className="mt-1 text-sm text-gray-500">No students have booked your courses yet.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
        Student Bookings for Your Courses
      </h1>
      <div className="space-y-6">
        {bookings.map(booking => {
          const sessionDisplay = booking.sessions?.length > 0
            ? booking.sessions.map(s => format(parseISO(s.sessionDate), 'dd MMM yy')).join(', ')
            : 'No sessions scheduled';

          return (
            <div key={booking.id} className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="md:flex md:justify-between md:items-start mb-3">
                    <div>
                        <h2 className="text-lg md:text-xl font-semibold text-indigo-700">
                            {booking.course?.title || 'Course Title Missing'}
                        </h2>
                        <p className="text-sm text-gray-600">
                            Student: <span className="font-medium">{booking.student?.name || 'N/A'}</span> ({booking.student?.email || 'N/A'})
                        </p>
                        <p className="text-xs text-gray-500">Phone: {booking.student?.phone || '-'}</p>
                        <p className="text-xs text-gray-500">Booked on: {format(parseISO(booking.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <div className="mt-3 md:mt-0 md:text-right">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(booking.bookingStatus)}`}>
                            {booking.bookingStatus}
                        </span>
                         <p className="text-xs text-gray-500 mt-1">Booking ID: {booking.id.substring(0,8)}</p>
                    </div>
                </div>

                <div className="mb-3 text-sm text-gray-600">
                  <strong>Session Dates:</strong> {sessionDisplay}
                </div>
                <div className="mb-4 text-sm text-gray-600">
                  <strong>Address:</strong> {booking.address}
                </div>

                <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Information:</h4>
                    <div className="text-sm text-gray-600 mb-1">
                        <strong>Method:</strong> {booking.paymentMethod}
                        {booking.paymentMethod === 'INSTALLMENT' && booking.totalInstallments && (
                            <span className="ml-2 text-xs">({booking.payments?.filter(p => p.status === 'PAID').length || 0} / {booking.totalInstallments} Paid)</span>
                        )}
                    </div>
                    {booking.payments && booking.payments.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-md">
                            {booking.payments.map(p => <InstallmentDetailRow key={p.id} payment={p} />)}
                        </div>
                    ) : (
                        <p className="text-xs italic text-gray-500">No payment details available.</p>
                    )}
                </div>
                
                {booking.bookingStatus === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'CONFIRMED', "confirm")}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                    >
                      Confirm Booking
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(booking.id, 'CANCELLED', "cancel")}
                      className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}