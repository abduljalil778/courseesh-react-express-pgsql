
// src/pages/MyBookings.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Mungkin berguna untuk navigasi detail
import { getAllBookings, updateBooking } from '../lib/api'; // Gunakan fungsi API
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns'; // Untuk format tanggal
import { formatCurrencyIDR } from '../utils/formatCurrency';

// Komponen kecil untuk menampilkan detail cicilan
const InstallmentDetail = ({ payment }) => (
  <div className={`text-xs p-1 my-0.5 rounded ${payment.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
    Inst. {payment.installmentNumber}: {formatCurrencyIDR(payment.amount)} - <strong>{payment.status}</strong>
    {payment.dueDate && payment.status === 'PENDING' && (
      <span className="ml-1 text-gray-600">(Due: {format(parseISO(payment.dueDate), 'dd MMM yyyy')})</span>
    )}
  </div>
);

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Untuk navigasi jika diperlukan

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings(); // Menggunakan fungsi API
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
        // Menggunakan fungsi updateBooking dari API
        await updateBooking(bookingId, { bookingStatus: 'CANCELLED' });
        Swal.fire({
          title: 'Cancelled!',
          text: 'Your booking has been cancelled.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
        loadBookings(); // Muat ulang daftar booking
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
      case 'CONFIRMED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">My Bookings</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked On</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Details</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map(booking => (
              <tr key={booking.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{booking.course?.title || 'N/A'}</div>
                  <div className="text-xs text-gray-500">ID: {booking.id.substring(0,8)}...</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(parseISO(booking.createdAt), 'dd MMM yyyy, HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(booking.bookingStatus)}`}>
                    {booking.bookingStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div><strong>Method:</strong> {booking.paymentMethod}</div>
                  {booking.paymentMethod === 'INSTALLMENT' && booking.totalInstallments && (
                    <div className="text-xs mt-1">
                      <strong>Installments:</strong> {booking.payments?.filter(p => p.status === 'PAID').length || 0} / {booking.totalInstallments} Paid
                    </div>
                  )}
                  {booking.payments && booking.payments.length > 0 ? (
                     <div className="mt-1 max-w-xs"> {/* Batasi lebar agar tidak terlalu panjang */}
                        {booking.payments.map(p => <InstallmentDetail key={p.id} payment={p} />)}
                     </div>
                  ) : (
                    <div className="text-xs italic">No payment records.</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Tombol "View Details" bisa ditambahkan di sini untuk navigasi ke halaman detail booking */}
                  {/* <button onClick={() => navigate(`/student/bookings/${booking.id}`)} className="text-indigo-600 hover:text-indigo-900 mr-3">Details</button> */}
                  
                  {booking.bookingStatus === 'PENDING' || booking.bookingStatus === 'CONFIRMED' ? (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      // Mungkin disable jika sudah lewat batas waktu cancel
                    >
                      Cancel Booking
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}