// src/pages/TeacherScheduleAndReports.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAllBookings,
  submitOrUpdateSessionReport,
  submitOverallBookingReport,
  // updateBooking, // Mungkin tidak diperlukan di sini, lebih ke halaman Booking Requests
} from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO, isPast } from 'date-fns'; // isPast untuk logika
import { formatCurrencyIDR } from '../utils/formatCurrency';
import SessionReportForm from '../components/SessionReportForm';
import OverallBookingReportForm from '../components/OverallBookingReportForm';

// Komponen InstallmentDetailRow jika ingin ditampilkan juga di sini (opsional)
// const InstallmentDetailRow = ({ payment }) => ( ... );
const PAYMENT_STATUS_PAID = "PAID"

export default function TeacherScheduleAndReports() {
  const [activeBookings, setActiveBookings] = useState([]); // Hanya booking CONFIRMED/COMPLETED
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);
  const [currentBookingForSessionModal, setCurrentBookingForSessionModal] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const [selectedBookingForOverall, setSelectedBookingForOverall] = useState(null);
  const [isOverallModalOpen, setIsOverallModalOpen] = useState(false);
  
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const navigate = useNavigate();

  const isBookingFullyPaid = (booking) => {
    if (booking.course?.price === 0) return true; // Kursus gratis dianggap lunas
    if (!booking.payments || booking.payments.length === 0) {
        return false;
    }
    return booking.payments.every(payment => payment.status === PAYMENT_STATUS_PAID);
  }

  const loadActiveBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings();
      const allTeacherBookings = response.data || [];
      
      const relevantBookings = allTeacherBookings.filter(booking => {
        const isStatusEligible = booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED';
        const isPaid = isBookingFullyPaid(booking);
        return isStatusEligible && isPaid; // Hanya tampilkan jika statusnya OK DAN sudah lunas
      });
      setActiveBookings(relevantBookings);
    } catch (err) {
      console.error('Could not load active bookings:', err);
      setError(err.response?.data?.message || 'Could not load active bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveBookings();
  }, [loadActiveBookings]);

  // Handlers untuk Modal Laporan Sesi
  const openSessionReportModal = (session, booking) => {
    setSelectedSession(session);
    setCurrentBookingForSessionModal(booking);
    setIsSessionModalOpen(true);
  };
  const closeSessionReportModal = () => { 
    setIsSessionModalOpen(false); 
    setSelectedSession(null); 
    setCurrentBookingForSessionModal(null);};

  const handleSessionReportSubmit = async (sessionId, data) => {
    setIsSubmittingReport(true);
    try {
      await submitOrUpdateSessionReport(sessionId, data);
      Swal.fire('Success', 'Session report saved!', 'success');
      closeSessionReportModal();
      loadActiveBookings(); 
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save session report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handlers untuk Modal Laporan Keseluruhan
  const openOverallReportModal = (booking) => {
    setSelectedBookingForOverall(booking); 
    setIsOverallModalOpen(true);};

  const closeOverallReportModal = () => {
    setIsOverallModalOpen(false); 
    setSelectedBookingForOverall(null);};

  const handleOverallReportSubmit = async (bookingId, data) => {
    setIsSubmittingReport(true);
    const payload = {...data};
    // teacher menandai booking selesai via form ini:
    if (!payload.bookingStatus && bookingId === selectedBookingForOverall?.id && selectedBookingForOverall?.bookingStatus !== 'COMPLETED') {
        payload.bookingStatus = 'COMPLETED'; // Otomatis set COMPLETED saat overall report disubmit
        payload.courseCompletionDate = new Date();
    }


    try {
      await submitOverallBookingReport(bookingId, payload);
      Swal.fire('Success', 'Overall report saved!', 'success');
      closeOverallReportModal();
      loadActiveBookings();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save overall report.', 'error');
    } finally {
      setIsSubmittingReport(false);
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
            <button onClick={loadActiveBookings} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Retry
            </button>
      </div>
    );
    }
  if (activeBookings.length === 0 && !isLoading) {
    return (
        <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Bookings Ready for Sessions/Reports</h3>
            <p className="mt-1 text-sm text-gray-500">
                There are no bookings that are confirmed and fully paid yet.
            </p>
            <p className="mt-1 text-sm text-gray-500">
                Students need to complete their payment after a booking is confirmed.
            </p>
            <button 
                onClick={() => navigate('/teacher/bookings')} // Arahkan ke halaman permintaan booking
                className="mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition"
            >
                View Booking Requests
            </button>
        </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
        Teaching Schedule & Reports
      </h1>
      <div className="space-y-8">
        {activeBookings.map(booking => (
          <div key={booking.id} className="bg-white shadow-xl rounded-lg">
            <div className="p-5 md:p-6">
              {/* Header Info Booking */}
              <div className="border-b pb-4 mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold text-indigo-700">{booking.course?.title}</h2>
                        <p className="text-sm text-gray-600">Student: <span className="font-medium">{booking.student?.name}</span> ({booking.student?.email})</p>
                    </div>
                    <span className={`mt-2 sm:mt-0 px-3 py-1 text-xs font-semibold rounded-full ${booking.bookingStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {booking.bookingStatus}
                    </span>
                </div>
              </div>

              {/* Daftar Sesi */}
              <div className="mb-6">
                <h3 className="text-md font-semibold text-gray-700 mb-3">Session Details & Reports:</h3>
                {booking.sessions && booking.sessions.length > 0 ? (
                  <ul className="space-y-4">
                    {booking.sessions.map((session, index) => (
                      <li key={session.id} className="p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between items-start">
                          <div className="flex-grow mb-2 sm:mb-0">
                            <p className="text-sm font-medium text-gray-800">
                              Session {index + 1}: {format(parseISO(session.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}
                            </p>
                            <p className={`text-xs font-semibold capitalize ${
                                session.status === 'COMPLETED' ? 'text-green-600' : 
                                session.status === 'STUDENT_ABSENT' ? 'text-red-600' : 
                                session.status === 'CANCELLED_TEACHER' || session.status === 'CANCELLED_STUDENT' ? 'text-orange-600' : 
                                'text-gray-500'
                            }`}>
                              Status: {(session.status || 'SCHEDULED').replace(/_/g, ' ')}
                            </p>
                            {session.studentAttendance !== null && (
                              <p className="text-xs text-gray-500">Attendance: {session.studentAttendance ? 'Present' : 'Absent'}</p>
                            )}
                          </div>
                          {/* Tombol Add/Edit Report hanya jika booking belum CANCELLED */}
                          {booking.bookingStatus !== 'CANCELLED' && (
                            <button
                              onClick={() => openSessionReportModal(session, booking)}
                              className="ml-2 mt-2 sm:mt-0 px-2.5 py-1 text-xs text-white bg-indigo-500 rounded-md hover:bg-indigo-600 whitespace-nowrap"
                            >
                              {session.teacherReport ? 'View/Edit Report' : 'Add Report'}
                            </button>
                          )}
                        </div>
                        {session.teacherReport && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-700">Teacher's Note:</p>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">{session.teacherReport}</p>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">No sessions available for this booking.</p>
                )}
              </div>

              {/* Laporan Keseluruhan */}
              {/* Hanya tampilkan opsi laporan keseluruhan jika booking belum CANCELLED */}
              {booking.bookingStatus !== 'CANCELLED' && (
                <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-md font-semibold text-gray-700">Overall Progress & Evaluation:</h3>
                        <button
                            onClick={() => openOverallReportModal(booking)}
                            className="px-3 py-1.5 text-xs text-white bg-purple-600 rounded-md hover:bg-purple-700"
                        >
                            {booking.overallTeacherReport || booking.finalGrade ? 'View/Edit Overall Report' : 'Add Overall Report'}
                        </button>
                    </div>
                    {booking.overallTeacherReport || booking.finalGrade ? (
                      <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700 space-y-1">
                        {booking.overallTeacherReport && <p><strong>Report:</strong> <span className="whitespace-pre-wrap">{booking.overallTeacherReport}</span></p>}
                        {booking.finalGrade && <p><strong>Grade:</strong> {booking.finalGrade}</p>}
                        {booking.courseCompletionDate && <p className="text-xs mt-1">Marked as Completed: {format(parseISO(booking.courseCompletionDate), 'dd MMM yyyy')}</p>}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No overall report or final grade submitted yet.</p>
                    )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal untuk Laporan Sesi */}
      {isSessionModalOpen && selectedSession && currentBookingForSessionModal && (
        <div className="modal-backdrop" onClick={closeSessionReportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold">
                    Report for Session {currentBookingForSessionModal.sessions.findIndex(s => s.id === selectedSession.id) + 1}
                </h2>
                <button onClick={closeSessionReportModal} className="text-gray-400 hover:text-gray-600"> {/* Tombol X */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <p className="text-sm text-gray-600 mb-1">Course: {currentBookingForSessionModal.course?.title}</p>
            <p className="text-sm text-gray-600 mb-3">Date: {format(parseISO(selectedSession.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}</p>
            <SessionReportForm
              session={selectedSession}
              onSubmit={handleSessionReportSubmit}
              onCancel={closeSessionReportModal}
              isSubmittingReport={isSubmittingReport}
            />
          </div>
        </div>
      )}

      {/* Modal untuk Laporan Keseluruhan */}
      {isOverallModalOpen && selectedBookingForOverall && (
        <div className="modal-backdrop" onClick={closeOverallReportModal}>
          <div className="modal-content-lg" onClick={(e) => e.stopPropagation()}>
            {/* ... (Header Modal dan Info Student) ... */}
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold">Overall Report for {selectedBookingForOverall.course?.title}</h2>
                <button onClick={closeOverallReportModal} className="text-gray-400 hover:text-gray-600"> {/* Tombol X */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Student: {selectedBookingForOverall.student?.name}</p>
            <OverallBookingReportForm
              booking={selectedBookingForOverall}
              onSubmit={handleOverallReportSubmit}
              onCancel={closeOverallReportModal}
              isSubmittingReport={isSubmittingReport}
            />
          </div>
        </div>
      )}
    </div>
  );
}
