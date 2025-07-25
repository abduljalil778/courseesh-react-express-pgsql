import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings } from '../lib/api';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { MagnifyingGlassIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import BookingDetailModal from '../components/BookingDetailModal';
import BookingDisplayStatus from '@/components/BookingDisplayStatus';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import TransactionSkeleton from '@/components/skeleton/TransactionSkeleton';



// Helper function
const findNextDuePayment = (booking) => {
  if (!booking || !booking.payments) return null;
  
  // Untuk pembayaran penuh yang masih pending
  if (booking.paymentMethod === 'FULL' && booking.payments[0]?.status === 'PENDING') {
      return booking.payments[0];
  }

  // Untuk cicilan, cari yang pertama kali pending
  if (booking.paymentMethod === 'INSTALLMENT') {
      return booking.payments.find(p => p.status === 'PENDING');
  }

  return null;
};


export default function TransactionList() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const debounceRef = useRef();
  const inputRef = useRef(null);
  const navigate = useNavigate();

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
    <>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button onClick={() => navigate('/student')} variant='ghost'>Home</Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage>Daftar Transaksi</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-8">Transaksi</h1>

        {/* Search */}
        <div className="mb-8">
          <div className="relative w-full max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search course"
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
              const displayStatus = BookingDisplayStatus(booking);
              const courseImageUrl = getImageUrl(booking);
              // const requiresPayment = displayStatus.text === 'Waiting for Payment';
              const nextPayment = findNextDuePayment(booking);
              return (
                <div
                  key={booking.id}
                  className="animate-fade-in relative bg-white rounded-2xl shadow-md flex flex-col md:flex-row items-center px-4 py-6 md:p-6 mb-6 group transition hover:shadow-lg"
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
                    <div className="absolute top-6 right-6 flex flex-col items-end gap-2">
                      <Badge className={displayStatus.colorClass} variant={displayStatus.variant}>{displayStatus.text}</Badge>
                      <div className="text-xs text-gray-500 mt-1">
                        {booking.paymentMethod === 'INSTALLMENT'
                          ? 'Installment Payment'
                          : 'Full Payment'}
                      </div>
                    </div>
                    {/* Tombol Aksi */}
                    <div className="mt-4 md:mt-0 self-end flex items-center justify-end gap-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        Lihat Detail
                      </Button>

                      {/* Tombol bayar */}
                      {nextPayment && (
                        <Button
                          size="sm"
                          onClick={() => navigate(`/student/bookings/${booking.id}/pay`)}
                        >
                          <CreditCardIcon className="h-4 w-4 mr-2" />
                          {booking.paymentMethod === 'INSTALLMENT' 
                            ? `Bayar Cicilan ${nextPayment.installmentNumber}` 
                            : 'Lanjutkan Pembayaran'}
                        </Button>
                      )}
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
    </>
  );
}