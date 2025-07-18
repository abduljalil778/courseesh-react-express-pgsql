import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { format, parseISO } from 'date-fns';
import PayoutUpdateForm from '../PayoutUpdateForm';
import Spinner from '../Spinner';

export default function PayoutDetailManagementModal({ payout, onClose, onUpdateSuccess }) {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    if (!payout) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/teacher-payouts/${payout.id}/sessions`);
      setSessions(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch session details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [payout]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  if (!payout) return null;

  const feePercentage = (payout.serviceFeePercentage * 100).toFixed(0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="modal-close-button" aria-label="Close modal">&times;</button>
        
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Kolom Kiri: Detail Sesi */}
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Rincian Sesi untuk Periode {format(parseISO(payout.periodStartDate), 'MMM yyyy')}
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Total Sesi: {payout.totalSessions} | Service Fee: {feePercentage}%
            </p>
            <p className="text-sm text-gray-500 mb-3">Total Sesi: {payout.totalSessions}</p>
            <div className="border rounded-lg max-h-96 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex justify-center items-center h-40"><Spinner /></div>
              ) : (
                <ul className="divide-y">
                  {sessions.map(session => (
                    <li key={session.id} className="p-3 text-sm">
                      <p className="font-medium text-gray-700">{session.booking.course.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(parseISO(session.sessionDate), 'dd MMM yyyy')} - Siswa: {session.booking.student.name}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Form Update Status */}
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Kelola Payout</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
                <PayoutUpdateForm 
                    payout={payout}
                    onSubmit={onUpdateSuccess}
                    onCancel={onClose}
                />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}