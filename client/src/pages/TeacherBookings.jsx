// src/pages/TeacherBookings.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllBookings,
  updateBooking, // Untuk update status booking utama (CONFIRMED/CANCELLED)
  submitOrUpdateSessionReport,
  submitOverallBookingReport,
} from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO, isPast } from 'date-fns'; // isPast untuk logika tombol report
import { formatCurrencyIDR } from '../utils/formatCurrency'; // Pastikan path ini benar
import SessionReportForm from '../components/SessionReportForm';
import OverallBookingReportForm from '../components/OverallBookingReportForm';

// Komponen InstallmentDetailRow tetap sama seperti yang Anda berikan, sudah baik.
const InstallmentDetailRow = ({ payment }) => (
  <div className={`text-xs px-2 py-1 my-0.5 rounded flex justify-between items-center ${payment.status === 'PAID' ? 'bg-green-100 text-green-700' : payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
    <span>Inst. {payment.installmentNumber}: {formatCurrencyIDR(payment.amount)}</span>
    <strong className="ml-2">{payment.status}</strong>
  </div>
);

export default function TeacherBookings() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk modal laporan sesi
  const [selectedSession, setSelectedSession] = useState(null); // Sesi yang sedang diedit laporannya
  const [currentBookingForSessionModal, setCurrentBookingForSessionModal] = useState(null); // Untuk info di modal sesi
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  // State untuk modal laporan keseluruhan
  const [selectedBookingForOverall, setSelectedBookingForOverall] = useState(null);
  const [isOverallModalOpen, setIsOverallModalOpen] = useState(false);
  
  const [isSubmittingReport, setIsSubmittingReport] = useState(false); // Loading state untuk kedua jenis submit report

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings();
      setBookings(response.data || []);
    } catch (err) {
      console.error('Could not load bookings:', err);
      setError(err.response?.data?.message || 'Could not load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleUpdateBookingStatus = async (bookingId, newStatus, actionVerb = "update") => {
    if (newStatus === 'CANCELLED') {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${actionVerb} this booking to ${newStatus}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: `Yes, ${actionVerb} it!`,
        });
        if (!result.isConfirmed) return;
    }
    try {
      await updateBooking(bookingId, { bookingStatus: newStatus });
      Swal.fire('Status Updated!', `Booking has been ${newStatus.toLowerCase()}.`, 'success');
      loadBookings();
    } catch (err) {
      Swal.fire('Update Failed', err.response?.data?.message || `Could not ${actionVerb} booking status.`, 'error');
    }
  };
  
  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'text-green-700 bg-green-100';
      case 'COMPLETED': return 'text-blue-700 bg-blue-100'; // Tambahkan status COMPLETED jika ada
      case 'PENDING': return 'text-yellow-700 bg-yellow-100';
      case 'CANCELLED': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // --- Handlers untuk Modal Laporan Sesi ---
  const openSessionReportModal = (session, booking) => {
    setSelectedSession(session);
    setCurrentBookingForSessionModal(booking); // Simpan booking untuk info di modal
    setIsSessionModalOpen(true);
  };
  const closeSessionReportModal = () => {
    setIsSessionModalOpen(false);
    setSelectedSession(null);
    setCurrentBookingForSessionModal(null);
  };
  const handleSessionReportSubmit = async (sessionId, data) => {
    setIsSubmittingReport(true);
    try {
      await submitOrUpdateSessionReport(sessionId, data);
      Swal.fire('Success', 'Session report saved!', 'success');
      closeSessionReportModal();
      loadBookings();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save session report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // --- Handlers untuk Modal Laporan Keseluruhan ---
  const openOverallReportModal = (booking) => {
    setSelectedBookingForOverall(booking);
    setIsOverallModalOpen(true);
  };
  const closeOverallReportModal = () => {
    setIsOverallModalOpen(false);
    setSelectedBookingForOverall(null);
  };
  const handleOverallReportSubmit = async (bookingId, data) => {
    setIsSubmittingReport(true);
    const payload = {...data};
    // Jika guru bisa set status COMPLETED dari form ini:
    // if (data.bookingStatus && BOOKING_STATUSES_FOR_COMPLETION.includes(data.bookingStatus)) {
    //    payload.bookingStatus = data.bookingStatus;
    //    payload.courseCompletionDate = new Date(); // Otomatis set tanggal jika status COMPLETED
    // } else {
    //    delete payload.bookingStatus; // Jangan kirim jika tidak dipilih atau tidak valid
    // }
    // Jika selalu set COMPLETED saat submit overall report:
    payload.bookingStatus = 'COMPLETED'; // Pastikan 'COMPLETED' ada di enum BookingStatus Anda
    payload.courseCompletionDate = new Date();


    try {
      await submitOverallBookingReport(bookingId, payload);
      Swal.fire('Success', 'Overall report saved!', 'success');
      closeOverallReportModal();
      loadBookings();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save overall report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };


  if (isLoading) { /* ... spinner ... */ }
  if (error) { /* ... error message ... */ }
  if (bookings.length === 0 && !isLoading) { /* ... no bookings message ... */ }

  return (
    <>
      {/* <style>{modalStyles}</style>  Anda bilang CSS sudah global, jadi ini tidak perlu */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
          Student Bookings & Reports
        </h1>
        <div className="space-y-8">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white shadow-xl rounded-lg overflow-hidden">
              <div className="p-5 md:p-6">
                {/* Info Booking Utama */}
                <div className="md:flex md:justify-between md:items-start mb-4 pb-4 border-b">
                  <div>
                    <h2 className="text-xl font-semibold text-indigo-700">{booking.course?.title || 'Course Title Missing'}</h2>
                    <p className="text-sm text-gray-600">
                      Student: <span className="font-medium">{booking.student?.name || 'N/A'}</span> ({booking.student?.email || 'N/A'})
                    </p>
                    <p className="text-xs text-gray-500">Phone: {booking.student?.phone || '-'}</p>
                    <p className="text-xs text-gray-500">Booked on: {format(parseISO(booking.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                  <div className="mt-3 md:mt-0 md:text-right">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Booking ID: {booking.id.substring(0,8)}...</p>
                    {booking.bookingStatus === 'PENDING' && (
                        <div className="mt-2 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-2">
                             <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED', "confirm")}
                                className="px-3 py-1 text-xs text-white bg-green-500 rounded hover:bg-green-600"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED', "cancel")}
                                className="px-3 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                  </div>
                </div>

                {/* Daftar Sesi dengan Opsi Laporan */}
                <div className="mb-4">
                    <h3 className="text-md font-semibold text-gray-800 mb-2">Sessions:</h3>
                    {booking.sessions && booking.sessions.length > 0 ? (
                    <ul className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        {booking.sessions.map(session => (
                        <li key={session.id} className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col sm:flex-row justify-between items-start">
                            <div className="flex-grow">
                                <p className="text-sm font-medium text-gray-700">
                                Session {booking.sessions.findIndex(s => s.id === session.id) + 1}: {format(parseISO(session.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}
                                </p>
                                <p className={`text-xs font-semibold ${session.status === 'COMPLETED' ? 'text-green-600' : (session.status === 'STUDENT_ABSENT' ? 'text-red-600' : 'text-gray-500')}`}>
                                Status: <span className="capitalize">{(session.status || 'SCHEDULED').replace('_', ' ')}</span>
                                </p>
                                {session.studentAttendance !== null && session.studentAttendance !== undefined && (
                                    <p className="text-xs text-gray-500">Attendance: {session.studentAttendance ? 'Present' : 'Absent'}</p>
                                )}
                                {session.teacherReport && (
                                <p className="text-xs text-gray-600 mt-1 pt-1 border-t border-gray-200">
                                    <strong className="block">Report:</strong> 
                                    <span className="block whitespace-pre-wrap">{session.teacherReport}</span>
                                </p>
                                )}
                            </div>
                            {/* Tombol Add/Edit Report */}
                            {(booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'PENDING') && ( // Hanya jika booking aktif
                                <button
                                onClick={() => openSessionReportModal(session, booking)} // Kirim booking untuk info kursus di modal
                                className="ml-2 mt-2 sm:mt-0 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-300 rounded-md hover:bg-indigo-50 whitespace-nowrap"
                                >
                                {session.teacherReport ? 'Edit Report' : 'Add Report'}
                                </button>
                            )}
                            </div>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-sm text-gray-500 italic">No sessions scheduled for this booking.</p>
                    )}
                </div>
                
                {/* Laporan Keseluruhan Booking */}
                <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-md font-semibold text-gray-800">Overall Progress & Evaluation</h4>
                        {booking.bookingStatus === 'CONFIRMED' && ( // Hanya jika booking sudah dikonfirmasi
                            <button
                                onClick={() => openOverallReportModal(booking)}
                                className="px-3 py-1.5 text-xs text-white bg-purple-600 rounded-md hover:bg-purple-700"
                            >
                                {booking.overallTeacherReport ? 'Edit Overall Report' : 'Add Overall Report'}
                            </button>
                        )}
                    </div>
                    {booking.overallTeacherReport || booking.finalGrade ? (
                        <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700 space-y-1">
                            {booking.overallTeacherReport && <p><strong>Report:</strong> <span className="whitespace-pre-wrap">{booking.overallTeacherReport}</span></p>}
                            {booking.finalGrade && <p><strong>Grade:</strong> {booking.finalGrade}</p>}
                            {booking.courseCompletionDate && <p className="text-xs mt-1">Course Marked as Completed on: {format(parseISO(booking.courseCompletionDate), 'dd MMM yyyy')}</p>}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No overall report submitted yet.</p>
                    )}
                </div>

                {/* Informasi Pembayaran (tetap sama) */}
                <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Information:</h4>
                    {/* ... (kode tampilan payment information Anda sudah baik) ... */}
                    <div className="text-sm text-gray-600 mb-1">
                        <strong>Method:</strong> {booking.paymentMethod}
                        {booking.paymentMethod === 'INSTALLMENT' && booking.totalInstallments && (
                            <span className="ml-2 text-xs">({booking.payments?.filter(p => p.status === 'PAID').length || 0} / {booking.totalInstallments} Paid)</span>
                        )}
                    </div>
                    {booking.payments && booking.payments.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-md custom-scrollbar">
                            {booking.payments.map(p => <InstallmentDetailRow key={p.id} payment={p} />)}
                        </div>
                    ) : (
                        <p className="text-xs italic text-gray-500">No payment details available.</p>
                    )}
                </div>

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
                <button onClick={closeSessionReportModal} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                Course: {currentBookingForSessionModal.course?.title}
              </p>
              <p className="text-sm text-gray-600 mb-3">
                Date: {format(parseISO(selectedSession.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}
              </p>
              <SessionReportForm
                session={selectedSession}
                onSubmit={handleSessionReportSubmit}
                onCancel={closeSessionReportModal}
                isSubmittingReport={isSubmittingReport}
              />
            </div>
          </div>
        )}

        {/* Modal untuk Laporan Keseluruhan Booking */}
        {isOverallModalOpen && selectedBookingForOverall && (
          <div className="modal-backdrop" onClick={closeOverallReportModal}>
            <div className="modal-content-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold">Overall Report for {selectedBookingForOverall.course?.title}</h2>
                 <button onClick={closeOverallReportModal} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
               <p className="text-sm text-gray-600 mb-3">
                Student: {selectedBookingForOverall.student?.name}
              </p>
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
    </>
  );
}
