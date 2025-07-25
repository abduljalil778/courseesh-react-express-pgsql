import React, { useEffect, useState, useCallback, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { getAllBookings, updatePayment } from '../../lib/api';
import { formatCurrencyIDR } from '../../utils/formatCurrency';
import Swal from 'sweetalert2';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/solid';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';

const PAGE_SIZE = 8;

const getOverallPaymentStatusForBooking = (booking) => {
  if (!booking.payments || booking.payments.length === 0) {
    return { text: 'NO PAYMENTS', colorClass: 'bg-gray-100 text-gray-800' };
  }
  if (booking.payments.every(p => p.status === 'PAID')) {
    return { text: 'FULLY PAID', colorClass: 'bg-green-100 text-green-800' };
  }
  if (booking.payments.some(p => p.status === 'PAID')) {
    return { text: 'PARTIALLY PAID', colorClass: 'bg-yellow-100 text-yellow-800' };
  }
  if (booking.payments.some(p => p.status === 'FAILED')) {
    return { text: 'HAS FAILED', colorClass: 'bg-red-100 text-red-800' };
  }
  return { text: 'PENDING', colorClass: 'bg-orange-100 text-orange-800' };
};

const SkeletonBookingCard = () => (
  <div className="border rounded-lg overflow-hidden bg-white animate-pulse mb-2">
    <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
      <div className="flex-1 w-full">
        <Skeleton className="h-5 w-2/3 mb-2 rounded" />
        <Skeleton className="h-4 w-1/3 mb-2 rounded" />
        <Skeleton className="h-4 w-1/2 mb-1 rounded" />
      </div>
      <div className="flex items-center gap-4 mt-2 md:mt-0 w-full md:w-auto">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-20 rounded" />
        <Skeleton className="h-6 w-10 rounded" />
      </div>
    </div>
    <div className="bg-gray-50 p-4 border-t">
      <Skeleton className="h-4 w-32 mb-2 rounded" />
      <Skeleton className="h-5 w-full rounded" />
    </div>
  </div>
);

export default function PaymentManagementPage() {
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const debounceRef = useRef();

  const totalPages = Math.max(1, Math.ceil(totalBookings / PAGE_SIZE));

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: PAGE_SIZE,
        sortBy,
        sortDir,
        search: searchTerm,
        filterStatus,
      };
      const response = await getAllBookings(params);
      setBookings(response.data?.bookings || response.data || []);
      setTotalBookings(response.data?.total || 0);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortDir, searchTerm, filterStatus]);

  // Debounce for search/filter/sort
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadBookings();
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [searchTerm, filterStatus, sortBy, sortDir]);

  // Fetch on page change
  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line
  }, [page]);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await updatePayment(paymentId, { status: newStatus });
      Swal.fire('Success', 'Payment status updated!', 'success');
      loadBookings();
    } catch (err) {
      Swal.fire('Error', err?.response?.data?.message || 'Could not update payment status.', 'error');
    }
  };

  const toggleExpand = (bookingId) => {
    setExpandedBookingId(currentId => (currentId === bookingId ? null : bookingId));
  };

  // Sorting kolom (optional, ex: by price, createdAt, etc)
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  // Filter bookings status (client-side, atau backend-side jika mau)
  const filteredBookings = bookings.filter(b => {
    const status = getOverallPaymentStatusForBooking(b).text;
    return filterStatus === 'ALL' || status === filterStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
      {/* Search, Filter */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by student, booking ID, email, or course name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm focus:ring-2 focus:ring-indigo-400"
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
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border-gray-300 rounded-md text-sm py-2 px-2"
        >
          <option value="ALL">All Status</option>
          <option value="FULLY PAID">Fully Paid</option>
          <option value="PARTIALLY PAID">Partially Paid</option>
          <option value="PENDING">Pending</option>
          <option value="HAS FAILED">Has Failed</option>
          <option value="NO PAYMENTS">No Payments</option>
        </select>
      </div>

      {/* Booking Card List */}
      <div className="bg-white rounded-lg shadow-lg min-h-[180px]">
        <div className="space-y-2 p-2">
          {isLoading ? (
            <>
              <SkeletonBookingCard />
              <SkeletonBookingCard />
              <SkeletonBookingCard />
            </>
          ) : error ? (
            <div className="text-center text-red-500 py-10">{error}</div>
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map(booking => {
              const paymentStatus = getOverallPaymentStatusForBooking(booking);
              const isExpanded = expandedBookingId === booking.id;

              return (
                <div key={booking.id} className="border rounded-lg overflow-hidden mb-2">
                  <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(booking.id)}>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">{booking.course?.title || '-'}</p>
                      <p className='text-sm text-gray-800'>{booking.id}</p>
                      <p className="text-sm text-gray-500">{booking.student?.name} ({booking.student?.email})</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 md:mt-0 w-full md:w-auto">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${paymentStatus.colorClass}`}>
                        {paymentStatus.text}
                      </span>
                      <span className="text-lg font-bold text-gray-700 w-32 text-right">
                        {formatCurrencyIDR((booking.course?.price || 0) * (booking.sessions?.length || 0))}
                      </span>
                      <button className="p-1 rounded-full hover:bg-gray-200">
                        {isExpanded ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="bg-gray-50 p-4 border-t animate-fade-in">
                      <h4 className="text-sm font-semibold mb-2">Payment Details:</h4>
                      {booking.payments?.length > 0 ? (
                        <ul className="space-y-2">
                          {booking.payments.map(payment => (
                            <li key={payment.id} className="flex items-center justify-between bg-white p-2 rounded-md border">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {booking.paymentMethod === 'FULL'
                                    ? 'Total Payment'
                                    : `Installment ${payment.installmentNumber}`}
                                  : {formatCurrencyIDR(payment.amount)}
                                </span>
                                <span className={`ml-2 text-xs font-bold ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{payment.status}</span>
                                {payment.dueDate && <span className="text-xs text-gray-500 ml-2"> (Due: {format(parseISO(payment.dueDate), 'dd MMM yy')})</span>}
                              </div>
                              <div className='flex items-center gap-2'>
                                {payment.proofOfPaymentUrl && <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payment.proofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Proof</a>}
                                {payment.status === 'PENDING' && (
                                  <button onClick={() => handleStatusUpdate(payment.id, 'PAID')} className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">Mark as Paid</button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : <p className="text-sm text-gray-500 italic">No payment details found.</p>}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="p-6 text-center text-gray-500">
              No bookings to manage{searchTerm && ` for "${searchTerm}"`}.
            </p>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-semibold">
            {(page - 1) * PAGE_SIZE + 1}
          </span>{" "}
          to{" "}
          <span className="font-semibold">
            {Math.min(page * PAGE_SIZE, totalBookings)}
          </span>{" "}
          of <span className="font-semibold">{totalBookings}</span> bookings
        </span>
        <div className="flex items-center justify-end mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-disabled={page === 1}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, idx) => (
                <PaginationItem key={idx + 1}>
                  <PaginationLink
                    isActive={page === idx + 1}
                    onClick={() => setPage(idx + 1)}
                  >
                    {idx + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
      {error && <div className="text-red-500 text-center mt-3">{error}</div>}
    </div>
  );
}
