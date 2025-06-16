import React, { useEffect, useState, useCallback, useRef } from "react";
import { format, parseISO } from "date-fns";
import {
  getAllTeacherPayoutsAdmin,
  updateTeacherPayoutAdmin,
} from "../../lib/api";
import { formatCurrencyIDR } from "../../utils/formatCurrency";
import Spinner from "../../components/Spinner";
import Swal from "sweetalert2";
import PayoutUpdateForm from "../../components/PayoutUpdateForm";
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

const PAGE_SIZE = 8;

export default function PayoutManagementPage() {
  const [payouts, setPayouts] = useState([]);
  const [totalPayouts, setTotalPayouts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const debounceRef = useRef();

  const totalPages = Math.max(1, Math.ceil(totalPayouts / PAGE_SIZE));

  // Skeleton Loader Row
  const SkeletonRow = () => (
    <tr>
      <td className="px-6 py-4">
        <Skeleton className="h-5 w-2/3 rounded" />
        <Skeleton className="h-4 w-1/3 rounded mt-2" />
      </td>
      <td className="px-6 py-4">
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-3 w-1/2 rounded mt-2" />
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
      <td className="px-6 py-4 text-right">
        <Skeleton className="h-5 w-12 rounded" />
      </td>
    </tr>
  );

  const loadPayouts = useCallback(async () => {
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
      const response = await getAllTeacherPayoutsAdmin(params);
      setPayouts(response.data?.payouts || response.data || []);
      setTotalPayouts(response.data?.total || (response.data?.payouts?.length || response.data?.length || 0));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load payouts. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, sortDir, searchTerm]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1); // Reset ke halaman 1 saat search/sort berubah
      loadPayouts();
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line
  }, [searchTerm, sortBy, sortDir]);

  useEffect(() => {
    loadPayouts();
    // eslint-disable-next-line
  }, [page]);

  const handleOpenModal = (payout) => {
    setSelectedPayout(payout);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPayout(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (payoutId, data) => {
    setIsSubmitting(true);
    try {
      await updateTeacherPayoutAdmin(payoutId, data);
      Swal.fire("Success!", "Teacher payout status updated.", "success");
      handleCloseModal();
      loadPayouts();
    } catch (err) {
      Swal.fire(
        "Error!",
        err.response?.data?.message || "Could not update teacher payout.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING_PAYMENT":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
      <h1 className="text-2xl font-bold text-gray-800">
        Teachers Payouts
      </h1>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {/* Search */}
        <div className="relative flex-grow max-w-xs">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teacher, booking, or bank info..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-400"
            aria-label="Search payouts"
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
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payout Info
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("honorariumAmount")}
              >
                Amount
                {sortBy === "honorariumAmount" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer select-none"
                onClick={() => handleSort("status")}
              >
                Status
                {sortBy === "status" &&
                  (sortDir === "asc" ? (
                    <ArrowUpIcon className="h-4 w-4 inline ml-1" />
                  ) : (
                    <ArrowDownIcon className="h-4 w-4 inline ml-1" />
                  ))}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Booking Info
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
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
            ) : payouts.length > 0 ? (
              payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payout.teacher?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payout.teacher?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {payout.teacher?.bankAccountHolder ? (
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {payout.teacher.bankName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payout.teacher.bankAccountNumber}
                        </div>
                        <div className="text-xs text-gray-500">
                          a/n {payout.teacher.bankAccountHolder}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Not Set
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                    {formatCurrencyIDR(payout.honorariumAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                        payout.status
                      )}`}
                    >
                      {payout.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800">
                      {payout.booking?.course?.title}
                    </div>
                    {payout.bookingSession && (
                      <div className="text-xs text-gray-500">
                        Session:{" "}
                        {format(
                          parseISO(payout.bookingSession.sessionDate),
                          "dd MMM yyyy"
                        )}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 font-mono">
                      Booking: {payout.bookingId.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(payout)}
                      className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400"
                      disabled={payout.status === "PAID"}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No payouts to manage.
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
            {Math.min(page * PAGE_SIZE, totalPayouts)}
          </span>{" "}
          of <span className="font-semibold">{totalPayouts}</span> payouts
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
      {/* Modal */}
      {isModalOpen && selectedPayout && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Manage Payout</h2>
            <PayoutUpdateForm
              payout={selectedPayout}
              onSubmit={handleSubmit}
              onCancel={handleCloseModal}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}
      {error && <div className="text-red-500 text-center mt-3">{error}</div>}
    </div>
  );
}
