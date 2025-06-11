// src/pages/admin/PayoutManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { getAllTeacherPayoutsAdmin, updateTeacherPayoutAdmin } from '../../lib/api';
import { formatCurrencyIDR } from '../../utils/formatCurrency';
import Spinner from '../../components/Spinner';
import Swal from 'sweetalert2';
import PayoutUpdateForm from '../../components/PayoutUpdateForm';

export default function PayoutManagementPage() {
  const [payouts, setPayouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPayouts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllTeacherPayoutsAdmin();
      setPayouts(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payouts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

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
        Swal.fire('Success!', 'Teacher payout status updated.', 'success');
        handleCloseModal();
        loadPayouts();
    } catch (err) {
        Swal.fire('Error!', err.response?.data?.message || 'Could not update teacher payout.', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Teacher Payout Management</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course (Booking)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {payouts.length > 0 ? payouts.map(payout => (
                    <tr key={payout.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payout.teacher?.name}</div>
                            <div className="text-sm text-gray-500">{payout.teacher?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-800">{payout.booking?.course?.title}</div>
                            <div className="text-xs text-gray-500 font-mono">Booking: {payout.bookingId.substring(0,8)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                            {formatCurrencyIDR(payout.honorariumAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payout.status)}`}>
                                {payout.status.replace(/_/g, ' ')}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.payoutDate ? format(parseISO(payout.payoutDate), 'dd MMM, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => handleOpenModal(payout)} className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400" disabled={payout.status === 'PAID' || payout.status === 'CANCELLED'}>
                                Manage
                            </button>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No payouts to manage.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {isModalOpen && selectedPayout && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}