// src/pages/MyBookings.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings, updateBooking } from '../lib/api'; //
import Spinner from '../components/Spinner'; //
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency'; //

const InstallmentDetail = ({ payment }) => (
  <div className={`text-xs p-1.5 my-0.5 rounded ${payment.status === 'PAID' ? 'bg-green-100 text-green-700' : payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
    Inst. {payment.installmentNumber}: {formatCurrencyIDR(payment.amount)} - <strong>{payment.status}</strong>
    {payment.dueDate && payment.status === 'PENDING' && (
      <span className="ml-1 text-gray-600 text-xs">(Due: {format(parseISO(payment.dueDate), 'dd MMM yy')})</span>
    )}
  </div>
);

// Komponen baru untuk menampilkan detail sesi siswa
const SessionDetailStudent = ({ session, index }) => (
  <div className={`text-xs p-1.5 my-0.5 rounded flex justify-between items-center ${session.isUnlocked ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
    <span>
      Sesi {index + 1}: {format(parseISO(session.sessionDate), 'dd MMM yy, HH:mm')}
      {session.status && session.status !== 'SCHEDULED' && <span className="ml-2 text-xs capitalize">({session.status.replace('_', ' ')})</span>}
    </span>
    {session.isUnlocked ? (
      <i className="fas fa-lock-open text-green-500" title="Session Unlocked"></i>
    ) : (
      <i className="fas fa-lock text-red-500" title="Session Locked"></i>
    )}
  </div>
);


export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings(); //
      setBookings(response.data || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setError(err.response?.data?.message || 'Failed to load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancelBooking = async (bookingId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to cancel this booking? This action might be irreversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
    });

    if (result.isConfirmed) {
      try {
        await updateBooking(bookingId, { bookingStatus: 'CANCELLED' }); //
        Swal.fire({
          title: 'Cancelled!',
          text: 'Your booking has been cancelled.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        loadBookings();
      } catch (err) {
        console.error('Failed to cancel booking:', err);
        Swal.fire({
          icon: 'error',
          title: 'Cancellation Failed',
          text: err.response?.data?.message || 'Could not cancel the booking. Please try again.',
        });
      }
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-700 bg-green-100';
      case 'COMPLETED': return 'text-blue-700 bg-blue-100';
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'CANCELLED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} /> {/* */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button
          onClick={loadBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!bookings.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-gray-500">You have no bookings yet.</p>
        <button 
            onClick={() => navigate('/student')}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
        >
            Find Courses
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">My Bookings</h1>
      <div className="space-y-6">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white shadow-lg rounded-xl p-5 md:p-6">
            <div className="md:flex md:justify-between md:items-start mb-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-indigo-700 Htruncate_custom">
                  {booking.course?.title || 'N/A'}
                </h2>
                <p className="text-sm text-gray-600">
                  Teacher: {booking.course?.teacher?.name || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  Booked: {format(parseISO(booking.createdAt), 'dd MMM yyyy, HH:mm')}
                </p>
                 <p className="text-xs text-gray-500">
                  Booking ID: {booking.id.substring(0,12)}...
                </p>
              </div>
              <div className="mt-3 md:mt-0 md:text-right">
                <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${getBookingStatusColor(booking.bookingStatus)}`}>
                  {booking.bookingStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Detail Pembayaran */}
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Payment Details:</h4>
                <div className="text-sm text-gray-600">
                  <p>Total: <span className="font-bold">{formatCurrencyIDR(booking.course?.price || 0)}</span></p> {/* */}
                  <p>Method: {booking.paymentMethod}</p>
                  {booking.paymentMethod === 'INSTALLMENT' && (
                    <p className="text-xs">
                      ({booking.payments?.filter(p => p.status === 'PAID').length || 0} / {booking.totalInstallments || 'N/A'} installments paid)
                    </p>
                  )}
                </div>
                {booking.payments && booking.payments.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {booking.payments.map(p => <InstallmentDetail key={p.id} payment={p} />)}
                  </div>
                ) : (
                  <div className="text-xs italic mt-1">No payment records.</div>
                )}
              </div>

              {/* Kolom Detail Sesi */}
              <div className="mb-3">
                 <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Session Status:</h4>
                 {booking.sessions && booking.sessions.length > 0 ? (
                   <div className="mt-1 space-y-1 max-h-32 overflow-y-auto custom-scrollbar pr-1"> {/* */}
                    {booking.sessions.map((s, index) => <SessionDetailStudent key={s.id} session={s} index={index} />)}
                   </div>
                 ) : (
                    <div className="text-xs italic">No sessions scheduled.</div>
                 )}
              </div>
            </div>
            
            {booking.overallTeacherReport && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Teacher's Overall Report:</h4>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded whitespace-pre-wrap">{booking.overallTeacherReport}</p>
                    {booking.finalGrade && <p className="text-xs text-gray-600 mt-1"><strong>Final Grade:</strong> {booking.finalGrade}</p>}
                </div>
            )}


            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
              {/* Tombol Aksi (misalnya, "Bayar Cicilan Berikutnya" atau "Lihat Detail Kursus") */}
              {/* Contoh:
              <button 
                onClick={() => navigate(`/student/courses/${booking.courseId}`)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200"
              >
                View Course Details
              </button>
              */}
              {(booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED') && 
               !booking.payments.every(p => p.status === 'PAID') && // Jika belum lunas semua
               booking.bookingStatus !== 'CANCELLED' && (
                <button
                    // onClick={() => navigateToPayment(booking.id)} // Anda perlu fungsi untuk navigasi ke halaman pembayaran
                    className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                    Pay Next Installment (Example)
                </button>
              )}

              {booking.bookingStatus === 'PENDING' && ( // Siswa hanya bisa cancel jika PENDING
                <button
                  onClick={() => handleCancelBooking(booking.id)}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Cancel Booking
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}