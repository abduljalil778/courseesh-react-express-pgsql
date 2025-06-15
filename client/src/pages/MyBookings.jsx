import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings, updateBooking, uploadProofOfPayment } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';

const InstallmentDetail = ({ payment, paymentMethod, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      Swal.fire('No File Selected', 'Please select a file to upload.', 'warning');
      return;
    }
    setIsUploading(true);
    try {
      await uploadProofOfPayment(payment.id, file);
      await Swal.fire('Success!', 'Proof of payment uploaded. Please wait for admin verification.', 'success');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      Swal.fire('Upload Failed', err.response?.data?.message || 'Could not upload file.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`p-3 my-1 rounded border-l-4 ${payment.status === 'PAID' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
      <div className="flex justify-between items-center">
        <div className="text-sm">
          <span className="font-medium">
            {paymentMethod === 'FULL'
              ? 'Total Payment'
              : `Installment ${payment.installmentNumber}`}
            : {formatCurrencyIDR(payment.amount)}
          </span>
          <strong className={`ml-2 ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{payment.status}</strong>
        </div>
        {payment.proofOfPaymentUrl && (
          <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payment.proofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
            View Proof
          </a>
        )}
      </div>
      {payment.status === 'PENDING' && !payment.proofOfPaymentUrl && (
        <div className="mt-3 pt-3 border-t border-dashed">
          <label className="block text-xs font-medium text-gray-700 mb-1">Upload Payment Proof:</label>
          <div className="flex items-center space-x-2">
            <input type="file" onChange={handleFileChange} accept="image/png, image/jpeg, image/jpg" className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            <button onClick={handleUpload} disabled={isUploading || !file} className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
              {isUploading ? <Spinner size={16} /> : 'Upload'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debounceRef = useRef();
  const navigate = useNavigate();

  // Fetch bookings with search term (debounced)
  const initialLoad = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings(searchTerm);
      setBookings(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Refresh after upload/cancel (respect search)
  const refreshBookings = useCallback(async () => {
    try {
      const response = await getAllBookings(searchTerm);
      setBookings(response.data || []);
    } catch (err) {
      console.error('Failed to reload bookings:', err);
      Swal.fire('Update Error', 'Could not refresh booking data. Please check your connection.', 'error');
    }
  }, [searchTerm]);
  
  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      initialLoad();
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, initialLoad]);

  // Initial load (tanpa search)
  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you want to cancel this booking?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
    });

    if (result.isConfirmed) {
      try {
        await updateBooking(bookingId, { bookingStatus: 'CANCELLED' });
        Swal.fire('Cancelled!', 'Your booking has been cancelled.', 'success');
        refreshBookings();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Could not cancel the booking.', 'error');
      }
    }
  };

  const getBookingDisplayStatus = (booking) => {
    const hasPaidPayment = booking.payments.some(p => p.status === 'PAID');
    if (booking.bookingStatus === 'PENDING') {
      if (!hasPaidPayment) {
        return { text: 'Waiting Teacher Confirmation', colorClass: 'text-orange-700 bg-orange-100' };
      }
      return { text: 'PENDING (Payment Processed)', colorClass: 'text-yellow-700 bg-yellow-100' };
    }
    switch (booking.bookingStatus) {
      case 'CONFIRMED': return { text: 'CONFIRMED', colorClass: 'text-green-700 bg-green-100' };
      case 'COMPLETED': return { text: 'COMPLETED', colorClass: 'text-blue-700 bg-blue-100' };
      case 'CANCELLED': return { text: 'CANCELLED', colorClass: 'text-red-700 bg-red-100' };
      default: return { text: booking.bookingStatus, colorClass: 'text-gray-700 bg-gray-100' };
    }
  };

  // ----------- SKELETON LOADER COMPONENT -----------
  const SkeletonBookingCard = () => (
    <div className="bg-white shadow-lg rounded-xl p-5 md:p-6 mb-4 animate-pulse">
      <div className="md:flex md:justify-between md:items-start mb-4 gap-4">
        <div className="flex-1">
          <Skeleton className="h-5 w-2/3 mb-2 rounded" />
          <Skeleton className="h-4 w-1/3 mb-2 rounded" />
          <Skeleton className="h-4 w-1/4 mb-1 rounded" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="mt-3 md:mt-0">
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-1/5 mb-3 rounded" />
      <Skeleton className="h-5 w-1/3 mb-2 rounded" />
      <Skeleton className="h-5 w-full mb-2 rounded" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-32 rounded" />
        <Skeleton className="h-8 w-32 rounded" />
      </div>
    </div>
  );
  // ------------- END SKELETON --------------

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">Transaction List</h1>
      
      {/* Search Bar */}
      <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-400"
            aria-label="Search bookings"
          />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={0}
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Area bookings/skeleton/error/empty */}
      <div className="space-y-6 min-h-[120px]">
        {isLoading ? (
          // Tampilkan 3 skeleton cards untuk loading
          <>
            <SkeletonBookingCard />
            <SkeletonBookingCard />
            <SkeletonBookingCard />
          </>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-xl text-red-600 mb-4">{error}</p>
            <button
              onClick={initialLoad}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : bookings.length > 0 ? (
          bookings.map(booking => {
            const displayStatus = getBookingDisplayStatus(booking);
            const hasPaidPayment = booking.payments.some(p => p.status === 'PAID');
            const canStudentCancel = booking.bookingStatus === 'PENDING' && !hasPaidPayment;

            return (
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
                      Booked: {format(parseISO(booking.createdAt), 'dd MMM yy, HH:mm')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Booking ID: {booking.id.substring(0,12)}...
                    </p>
                  </div>
                  <div className="mt-3 md:mt-0 md:text-right">
                    <span className={`px-3 py-1.5 inline-flex text-sm leading-5 font-semibold rounded-full ${displayStatus.colorClass}`}>
                      {displayStatus.text}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1.5">Payment Details:</h4>
                  <div className="text-sm text-gray-600">
                    <p>Total: <span className="font-bold">{formatCurrencyIDR(booking.course?.price || 0)}</span></p>
                    <p>Method: {booking.paymentMethod}</p>
                    {booking.paymentMethod === 'INSTALLMENT' && (
                      <p className="text-xs">
                        ({booking.payments?.filter(p => p.status === 'PAID').length || 0} / {booking.totalInstallments || 'N/A'} installments paid)
                      </p>
                    )}
                  </div>
                  {booking.payments && booking.payments.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {booking.payments.map(p => (
                        <InstallmentDetail 
                          key={p.id} 
                          payment={p}
                          paymentMethod={booking.paymentMethod}
                          onUploadSuccess={refreshBookings} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs italic mt-1">No payment records.</div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-2 sm:space-y-0">
                  {booking.payments.some(p => p.status === 'PENDING') && booking.bookingStatus !== 'CANCELLED' && (
                    <button
                      onClick={() => navigate(`/student/bookings/${booking.id}/pay`)}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                    >
                      Complete Payment
                    </button>
                  )}
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={!canStudentCancel}
                    className={`w-full sm:w-auto px-4 py-2 text-xs font-medium text-white rounded-md ${
                      canStudentCancel ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    title={!canStudentCancel ? (hasPaidPayment ? 'Cannot cancel after payment' : 'Cancellation only for PENDING bookings') : 'Cancel this booking'}
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p className="text-xl">No bookings found{searchTerm && ` for "${searchTerm}"`}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
