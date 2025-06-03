// src/pages/MyPayouts.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getMyPayoutsTeacher } from '../lib/api';
import Spinner from '../components/Spinner';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
// import { Link } from 'react-router-dom'; // Jika perlu link ke detail booking

export default function MyPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMyPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getMyPayoutsTeacher();
      setPayouts(response.data || []);
    } catch (err) {
      console.error('Failed to load my payouts:', err);
      setError(err.response?.data?.message || 'Could not load your payouts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyPayouts();
  }, [loadMyPayouts]);

  const getPayoutStatusColor = (status) => {
    // Anda bisa menggunakan fungsi yang sama dari AdminDashboard atau definisikan ulang
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED':
      case 'CANCELLED': return 'bg-red-100 text-red-800';
    //   case 'PENDING_CALCULATION': return 'bg-purple-100 text-purple-800'; // Jika status ini bisa dilihat teacher
      default: return 'bg-gray-100 text-gray-800';
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
          onClick={loadMyPayouts}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">My Payouts</h1>
        <div className="text-center py-10 bg-white shadow-md rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H7a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Payouts Yet</h3>
            <p className="mt-1 text-sm text-gray-500">You currently do not have any payout records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
        My Payouts
      </h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Generated</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course (Booking)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Honorarium</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payouts.map((payout) => (
              <tr key={payout.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(parseISO(payout.createdAt), 'dd MMM yy, HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{payout.booking?.course?.title || 'N/A'}</div>
                  <div className="text-xs text-gray-500" title={payout.bookingId}>
                    Booking ID: {payout.bookingId?.substring(0, 8)}...
                    {/* <Link to={`/teacher/bookings/${payout.bookingId}`} className="ml-1 text-indigo-600 hover:underline">(Details)</Link> */}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {payout.booking?.student?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                  {formatCurrencyIDR(payout.honorariumAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getPayoutStatusColor(payout.status)}`}>
                    {payout.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payout.payoutDate ? format(parseISO(payout.payoutDate), 'dd MMM yyyy') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {payout.payoutTransactionRef || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}