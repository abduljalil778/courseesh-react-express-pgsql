// src/pages/admin/PaymentManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { getAllPayments, updatePayment } from '../../lib/api'; // Pastikan updatePayment ada di api.js
import { formatCurrencyIDR } from '../../utils/formatCurrency';
import Spinner from '../../components/Spinner';
import Swal from 'sweetalert2';

export default function PaymentManagementPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllPayments(); // Mengambil semua record Payment
      setPayments(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      await updatePayment(paymentId, { status: newStatus });
      Swal.fire('Success', 'Payment status updated!', 'success');
      loadPayments(); // Reload data untuk menampilkan perubahan
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Could not update payment status.', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
      case 'REFUNDED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Payment Transaction Management</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proof</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {payments.length > 0 ? payments.map(payment => (
                    <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payment.booking?.course?.title || 'N/A'}</div>
                            <div className="text-sm text-gray-500 font-mono" title={payment.bookingId}>Booking ID: {payment.bookingId?.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{payment.booking?.student?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrencyIDR(payment.amount)}
                            {payment.booking?.paymentMethod === 'INSTALLMENT' && <span className="text-xs text-gray-500 ml-1">(Inst. {payment.installmentNumber})</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                {payment.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.dueDate ? format(parseISO(payment.dueDate), 'dd MMM, yyyy') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payment.proofOfPaymentUrl ? (
                                <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payment.proofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    View
                                </a>
                            ) : (
                                <span className="text-gray-400">None</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {payment.status === 'PENDING' && (
                                <button onClick={() => handleStatusUpdate(payment.id, 'PAID')} className="text-green-600 hover:text-green-900">
                                    Mark as Paid
                                </button>
                            )}
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No payment records found.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}