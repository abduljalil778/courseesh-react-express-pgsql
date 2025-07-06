// src/components/BookingDetailModal.jsx
import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { uploadProofOfPayment, updateBooking } from '../lib/api';
import Swal from 'sweetalert2';
import Spinner from './Spinner';
import { Button } from '@/components/ui/button';

export default function BookingDetailModal({ booking, onClose, refreshBookings }) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleUploadProof = async (paymentId) => {
    if (!selectedFile) {
      Swal.fire('No File', 'Please select a file to upload.', 'warning');
      return;
    }
    setUploading(true);
    try {
      await uploadProofOfPayment(paymentId, selectedFile);
      await Swal.fire('Success!', 'Proof of payment uploaded.', 'success');
      setSelectedFile(null);
      refreshBookings && refreshBookings();
    } catch (err) {
      Swal.fire('Upload Failed', err?.response?.data?.message || 'Failed to upload.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelBooking = async () => {
    const result = await Swal.fire({
      title: 'Cancel this booking?',
      text: "You cannot revert this action.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, cancel it!',
    });

    if (result.isConfirmed) {
      try {
        await updateBooking(booking.id, { bookingStatus: 'CANCELLED' });
        Swal.fire('Cancelled!', 'Your booking has been cancelled.', 'success');
        refreshBookings && refreshBookings();
        onClose();
      } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Could not cancel the booking.', 'error');
      }
    }
  };

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/30 px-4">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full overflow-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Transaction Details</h2>
            <div className="text-xs text-gray-500">
              Booking ID: {booking.id.slice(0, 16)}...
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <div className="font-semibold text-gray-800 mb-1">{booking.course?.title}</div>
            <div className="text-sm text-gray-600">Teacher: {booking.course?.teacher?.name || '-'}</div>
            <div className="text-xs text-gray-500">
              Booked: {format(parseISO(booking.createdAt), 'dd MMM yyyy')}
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Payment:</div>
            {booking.payments && booking.payments.length > 0 ? (
              booking.payments.map(payment => (
                <div key={payment.id} className={`mb-3 rounded border-l-4 p-3 ${payment.status === 'PAID' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {booking.paymentMethod === 'FULL'
                          ? 'Total Payment'
                          : `Installment ${payment.installmentNumber}`}
                        : {formatCurrencyIDR(payment.amount)}
                      </span>
                      <strong className={`ml-2 ${payment.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>{payment.status}</strong>
                    </div>
                    {payment.proofOfPaymentUrl && (
                      <a
                        href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payment.proofOfPaymentUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Proof
                      </a>
                    )}
                  </div>
                  {payment.status === 'PENDING' && !payment.proofOfPaymentUrl && (
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="text-xs"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        onClick={() => handleUploadProof(payment.id)}
                        disabled={uploading || !selectedFile}
                        className="ml-2"
                        size="sm"
                      >
                        {uploading ? <Spinner size={16} /> : 'Upload Proof'}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-xs italic text-gray-500">No payment records found.</div>
            )}
          </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          {booking.bookingStatus === 'PENDING' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelBooking}
              className="mr-2"
            >
              Cancel Booking
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}