import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getAllBookings } from '../lib/api';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { MagnifyingGlassIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import BookingDetailModal from '../components/BookingDetailModal';



// Helper status
const getBookingDisplayStatus = (booking) => {
  const hasPaidPayment = booking.payments?.some(p => p.status === 'PAID');
  if (booking.bookingStatus === 'PENDING') {
    if (!hasPaidPayment) {
      return { text: 'Waiting for Payment', colorClass: 'text-orange-700 bg-orange-100' };
    }
    return { text: 'Waiting Teacher Confirmation', colorClass: 'text-yellow-700 bg-yellow-100' };
  }
  switch (booking.bookingStatus) {
    case 'CONFIRMED': return { text: 'On Going', colorClass: 'text-green-700 bg-green-100' };
    case 'COMPLETED': return { text: 'Completed', colorClass: 'text-blue-700 bg-blue-100' };
    case 'CANCELLED': return { text: 'Cancelled', colorClass: 'text-red-700 bg-red-100' };
    default: return { text: booking.bookingStatus, colorClass: 'text-gray-700 bg-gray-100' };
  }
};

// Skeleton minimal
const TransactionSkeleton = () => (
  <div className="bg-white rounded-2xl shadow flex items-center p-6 my-4 animate-pulse min-h-[112px]">
    <div className="w-24 h-24 rounded-xl bg-gray-200 mr-6" />
    <div className="flex-1 space-y-3">
      <div className="h-6 w-2/5 bg-gray-200 rounded" />
      <div className="h-4 w-1/4 bg-gray-100 rounded" />
      <div className="h-4 w-1/3 bg-gray-100 rounded" />
      <div className="h-4 w-1/6 bg-gray-100 rounded" />
    </div>
    <div className="h-9 w-36 bg-gray-200 rounded-full ml-auto" />
  </div>
);

export default function TransactionList() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const debounceRef = useRef();
  const inputRef = useRef(null);

  // Fetch bookings
  const fetchBookings = useCallback(async (search = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (search) params.search = search;
      const response = await getAllBookings(params);
      setBookings(response.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your bookings. Please try again.');
    } finally {
      setIsLoading(false);
      setIsDebouncing(false);
    }
  }, []);

  // Initial load & whenever searchTerm changes (debounced)
  useEffect(() => {
    if (isDebouncing) return;
    fetchBookings(searchTerm);
  }, [fetchBookings, searchTerm, isDebouncing]);

  // Debounced search handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsDebouncing(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setIsDebouncing(false);
    }, 400);
  };

  // Clear search & keep focus
  const handleClearSearch = () => {
    setSearchTerm('');
    setIsDebouncing(false);
    inputRef.current?.focus();
  };

  // Gambar handler
  const placeholderImage = "/placeholder-course.jpg";

  const getImageUrl = (booking) => {
    if (booking.course?.imageUrl) {
      return `${import.meta.env.VITE_API_URL.replace('/api', '')}${booking.course.imageUrl}`;
    }
    return placeholderImage;
  };

  // List kosong/empty
  const isEmpty = !isLoading && bookings.length === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-8">Daftar Transaksi</h1>

        {/* Search */}
        <div className="mb-8">
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by course, teacher, or booking id."
              className="w-full pl-10 pr-14 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {searchTerm && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={handleClearSearch}
                aria-label="Clear search"
                tabIndex={0}
              >
                <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          {isLoading ? (
            <>
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </>
          ) : isEmpty ? (
            <div className="text-center p-10">
              <div className="text-5xl mb-3"></div>
              <div className="text-lg text-gray-500">
                No transactions found
                {searchTerm && (
                  <> for <span className="font-bold text-black">&quot;{searchTerm}&quot;</span></>
                )}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-red-600">
              <div className="text-2xl mb-3">Error</div>
              <div className="mb-3">{error}</div>
              <Button onClick={() => fetchBookings(searchTerm)}>
                Retry
              </Button>
            </div>
          ) : (
            bookings.map((booking) => {
              const displayStatus = getBookingDisplayStatus(booking);
              const courseImageUrl = getImageUrl(booking);
              return (
                <div
                  key={booking.id}
                  className="relative bg-white rounded-2xl shadow-md flex flex-col md:flex-row items-center px-4 py-6 md:p-6 mb-6 group transition hover:shadow-lg"
                >
                  {/* Image */}
                  <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 font-bold text-2xl relative">
                    <img
                      src={courseImageUrl}
                      alt={booking.course?.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.onerror = null; e.target.src = placeholderImage }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 w-full md:ml-8 mt-5 md:mt-0 flex flex-col justify-between">
                    <div>
                      <h2 className="text-xl font-extrabold text-gray-900 mb-1">
                        {booking.course?.title}
                      </h2>
                      <div className="text-sm text-gray-600 mb-0.5">
                        Booking ID: <span className="font-mono">{booking.id.substring(0,12)}...</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Teacher: {booking.course?.teacher?.name || '-'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Booked: {format(parseISO(booking.createdAt), 'dd MMM yyyy')}
                      </div>
                      <div className="font-bold text-lg text-gray-800 mt-3">
                        Total: {formatCurrencyIDR((booking.course?.price || 0) * (booking.sessions?.length || 0))}
                      </div>
                    </div>
                    {/* Status and Payment Method - Moved to top right */}
                    <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                      <span className={`px-4 py-2 font-bold text-base rounded-full ${displayStatus.colorClass}`}>
                        {displayStatus.text}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {booking.paymentMethod === 'INSTALLMENT'
                          ? 'Installment Payment'
                          : 'Full Payment'}
                      </div>
                    </div>
                    {/* Button - Moved to bottom right */}
                    <div className="mt-4 md:mt-0 self-end flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="
                          font-semibold text-base flex items-center gap-2
                          min-w-[200px]
                          w-full md:w-auto
                          "
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <CreditCardIcon className="h-4 w-4" />
                        View &amp; Manage Payment
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}