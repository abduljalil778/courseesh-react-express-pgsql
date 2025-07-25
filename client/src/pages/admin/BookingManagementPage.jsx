// src/pages/admin/BookingManagementPage.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { getAllBookings } from "../../lib/api";
import {
  MagnifyingGlassIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { formatCurrencyIDR } from "@/utils/formatCurrency";

const PAGE_SIZE = 8;

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const debounceRef = useRef();
  const navigate = useNavigate();

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
      };
      if (searchTerm) params.search = searchTerm;
      if (filterStatus && filterStatus !== "ALL") params.status = filterStatus;
      const response = await getAllBookings(params);
      setBookings(response.data?.bookings || []);
      setTotalBookings(response.data?.total || 0);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load bookings. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortDir, searchTerm, filterStatus]);

  // Debounced filter/search/sort
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1); // Reset page saat filter berubah
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

  const getBookingStatusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getOverallPaymentStatusForBooking = (booking) => {
    if (!booking.payments || booking.payments.length === 0) {
      return { text: "NO PAYMENTS", colorClass: "bg-gray-100 text-gray-800" };
    }
    if (booking.payments.every((p) => p.status === "PAID")) {
      return { text: "FULLY PAID", colorClass: "bg-green-100 text-green-800" };
    }
    if (booking.payments.some((p) => p.status === "PAID")) {
      return {
        text: "PARTIALLY PAID",
        colorClass: "bg-yellow-100 text-yellow-800",
      };
    }
    if (booking.payments.some((p) => p.status === "FAILED")) {
      return { text: "HAS FAILED", colorClass: "bg-red-100 text-red-800" };
    }
    return { text: "PENDING", colorClass: "bg-orange-100 text-orange-800" };
  };

  // Skeleton Loader Row
  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-2/3 rounded" />
        <Skeleton className="h-4 w-1/3 rounded mt-2" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/2 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/2 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-20 rounded" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-24 rounded" />
      </td>
    </tr>
  );

  // Sorting kolom
  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
              tabIndex={0}
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
        {/* Status */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border-gray-300 rounded-md text-sm py-2 px-2"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      {/* Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("course.title")}
              >
                Booking Info
                {sortBy === "course.title" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("bookingStatus")}
              >
                Booking Status
                {sortBy === "bookingStatus" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payment Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : bookings.length > 0 ? (
              bookings.map((booking) => {
                const paymentStatus = getOverallPaymentStatusForBooking(booking);
                return (
                  <tr
                    key={booking.id}
                    className="cursor-pointer hover:bg-indigo-50"
                    // onClick={() => navigate(`/admin/bookings/${booking.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.course?.title}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {booking.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {booking.student?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {booking.course?.teacher?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrencyIDR((booking.course?.price || 0) * (booking.sessions?.length || 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(
                          booking.bookingStatus
                        )}`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatus.colorClass}`}
                      >
                        {paymentStatus.text}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination Modern ala shadcn */}
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
