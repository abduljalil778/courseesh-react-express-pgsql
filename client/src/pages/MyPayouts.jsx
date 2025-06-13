// src/pages/MyPayouts.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getMyPayoutsTeacher } from '../lib/api';
import Spinner from '../components/Spinner';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import PayoutDetailModal from '../components/PayoutDetailModal'; 

export default function MyPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null); 

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
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED':
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={loadMyPayouts} className="text-blue-500 underline ml-2">Retry</button></div>;
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
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
          My Payouts
        </h1>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Payout</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(payout.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{payout.booking?.course?.title || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                    {formatCurrencyIDR(payout.honorariumAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getPayoutStatusColor(payout.status)}`}>
                      {payout.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {payout.adminProofOfPaymentUrl ? (
                      <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payout.adminProofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View Proof
                      </a>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedPayout(payout)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPayout && (
        <PayoutDetailModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
        />
      )}
    </>
  );
}