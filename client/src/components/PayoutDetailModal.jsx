// client/src/components/PayoutDetailModal.jsx

import React from 'react';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';

export default function PayoutDetailModal({ payout, onClose }) {
  if (!payout) return null;

  const feePercentage = (payout.serviceFeePercentage * 100).toFixed(0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button" aria-label="Close modal">&times;</button>
        
        <div className="p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">Payout Details</h2>
          <p className="text-center text-sm text-gray-500 font-mono mb-6">ID: {payout.id}</p>

          <div className="grid grid-cols-2 gap-4 text-sm mb-8">
            <div>
              <p className="text-gray-500">Payout Date</p>
              <p className="font-semibold text-gray-800">
                {payout.payoutDate ? format(parseISO(payout.payoutDate), 'dd MMMM yyyy') : 'Pending'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Status</p>
              <p className="font-semibold text-indigo-600">{payout.status.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-gray-500">For Course</p>
              <p className="font-semibold text-gray-800">{payout.booking?.course?.title}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500">Student</p>
              <p className="font-semibold text-gray-800">{payout.booking?.student?.name}</p>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Session Details</h3>
            <div className="space-y-2">
              {payout.bookingSession ? (
                <div className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-md">
                  <span className="text-gray-600">
                    {format(parseISO(payout.bookingSession.sessionDate), 'EEEE, dd MMM yyyy')}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    COMPLETED
                  </span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No session details available.</p>
              )}
            </div>
          </div>

          <div className="border-t border-b py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Course Revenue (Gross)</span>
                <span className="font-medium text-gray-800">{formatCurrencyIDR(payout.coursePriceAtBooking)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Platform Service Fee ({feePercentage}%)</span>
                <span className="font-medium text-red-600">-{formatCurrencyIDR(payout.serviceFeeAmount)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-base font-semibold text-gray-800">Net Payout (Honorarium)</span>
            <span className="text-xl font-bold text-green-600">{formatCurrencyIDR(payout.honorariumAmount)}</span>
          </div>
          
          
        </div>
      </div>
    </div>
  );
}