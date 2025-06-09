// src/pages/TeacherBookingManageDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getBookingById,
  submitOrUpdateSessionReport,
  submitOverallBookingReport,
} from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import SessionReportForm from '../components/SessionReportForm';
import OverallBookingReportForm from '../components/OverallBookingReportForm';

const SESSION_STATUS_COMPLETED = 'COMPLETED';

export default function TeacherBookingManageDetail() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

  const [isOverallModalOpen, setIsOverallModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await getBookingById(bookingId);
      setBooking(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  const areAllSessionsCompleted = (bookingToCheck) => {
    if (!bookingToCheck || !bookingToCheck.sessions || !bookingToCheck.course?.numberOfSessions) {
      return false;
    }
    if (bookingToCheck.sessions.length < bookingToCheck.course.numberOfSessions) {
      return false;
    }
    return bookingToCheck.sessions.every(session => session.status === SESSION_STATUS_COMPLETED);
  };

  const openSessionReportModal = (session) => {
    if (!session.isUnlocked) {
      Swal.fire('Session Locked', 'This session is not yet unlocked.', 'info');
      return;
    }
    setSelectedSession(session);
    setIsSessionModalOpen(true);
  };

  const closeSessionReportModal = () => {
    setIsSessionModalOpen(false);
    setSelectedSession(null);
  };

  const handleSessionReportSubmit = async (sessionId, data) => {
    setIsSubmittingReport(true);
    try {
      await submitOrUpdateSessionReport(sessionId, data);
      Swal.fire('Success', 'Session report saved!', 'success');
      closeSessionReportModal();
      fetchBookingDetails(); // Reload data
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save session report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const openOverallReportModal = () => {
    if (!areAllSessionsCompleted(booking)) {
      Swal.fire('Not Yet!', 'All sessions must be marked as COMPLETED first.', 'info');
      return;
    }
    setIsOverallModalOpen(true);
  };

  const closeOverallReportModal = () => {
    setIsOverallModalOpen(false);
  };

  const handleOverallReportSubmit = async (currentBookingId, data) => {
    setIsSubmittingReport(true);
    try {
      await submitOverallBookingReport(currentBookingId, data);
      Swal.fire('Success', 'Overall report saved!', 'success');
      closeOverallReportModal();
      fetchBookingDetails(); // Reload data
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save overall report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };


  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={fetchBookingDetails} className="text-blue-500 underline ml-2">Retry</button></div>;
  if (!booking) return <div className="p-6 text-center text-gray-500">Booking not found.</div>;

  const allSessionsDone = areAllSessionsCompleted(booking);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <button onClick={() => navigate('/teacher/schedules')} className="mb-4 text-sm text-indigo-600 hover:underline">
        &larr; Back to All Schedules
      </button>

      <div className="bg-white shadow-xl rounded-lg p-5 md:p-8 space-y-8">
        {/* Booking Header */}
        <div className="border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-700">{booking.course?.title}</h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p><strong>Student:</strong> {booking.student?.name}</p>
            <p><strong>Phone:</strong> {booking.student?.phone || 'N/A'}</p>
            <p><strong>Address:</strong> {booking.address || 'N/A'}</p>
          </div>
          <p className={`text-sm font-medium mt-2`}>
            Booking Status: 
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                booking.bookingStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                booking.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                'bg-yellow-100 text-yellow-700'
            }`}>
                {booking.bookingStatus}
            </span>
          </p>
        </div>

        {/* Session List */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            Session Details & Reports: ({booking.sessions?.filter(s => s.status === 'COMPLETED').length || 0} / {booking.course?.numberOfSessions || 0} sessions completed)
          </h2>
          <ul className="space-y-4">
            {booking.sessions.map((session, index) => (
              <li key={session.id} className={`p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start ${session.isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-100 opacity-80'}`}>
                <div className="flex-grow">
                  <p className="font-semibold text-gray-800">Session {index + 1}: {format(parseISO(session.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}</p>
                  <p className="text-xs font-medium capitalize mt-0.5">
                    Status: <span className={`${session.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-500'}`}>{(session.status || 'SCHEDULED').replace(/_/g, ' ')}</span>
                    {!session.isUnlocked && <i className="fas fa-lock text-gray-400 ml-2" title="Locked"></i>}
                  </p>
                  {session.studentAttendance !== null && <p className="text-xs text-gray-500">Student Attendance: {session.studentAttendance ? 'Present' : 'Absent'}</p>}
                  {session.teacherReport && <p className="text-xs text-gray-500 mt-1 italic">Report already submitted.</p>}
                </div>
                <div className="mt-2 sm:mt-0 flex-shrink-0">
                  <button onClick={() => openSessionReportModal(session)} disabled={!session.isUnlocked} className="px-3 py-1.5 text-xs text-white rounded-md bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                    {session.teacherReport ? 'View/Edit Report' : 'Add Report'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Overall Report Section */}
        <div className="border-t pt-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Overall Progress & Evaluation</h2>
                <button onClick={openOverallReportModal} disabled={!allSessionsDone} className="px-4 py-2 text-sm font-medium text-white rounded-md bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed" title={!allSessionsDone ? 'Complete all sessions to submit' : 'Submit Overall Report'}>
                    {booking.overallTeacherReport ? 'Edit Overall Report' : 'Add Overall Report'}
                </button>
            </div>
            {booking.overallTeacherReport ? (
                <div className="mt-3 bg-gray-50 p-4 rounded-md text-sm text-gray-700">
                    <p className="whitespace-pre-wrap">{booking.overallTeacherReport}</p>
                    {booking.finalGrade && <p className="mt-2"><strong>Final Grade:</strong> {booking.finalGrade}</p>}
                </div>
            ) : (
                <p className="mt-2 text-sm text-gray-500 italic">No overall report submitted yet. {
                    !allSessionsDone && "Please mark all sessions as COMPLETED to submit the final report."
                }</p>
            )}
        </div>
      </div>

      {/* Modals */}
      {isSessionModalOpen && selectedSession && (
        <div className="modal-backdrop" onClick={closeSessionReportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold">Report for Session {booking.sessions.findIndex(s => s.id === selectedSession.id) + 1}</h2>
                <button onClick={closeSessionReportModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Date: {format(parseISO(selectedSession.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}</p>
            <SessionReportForm session={selectedSession} onSubmit={handleSessionReportSubmit} onCancel={closeSessionReportModal} isSubmittingReport={isSubmittingReport} />
          </div>
        </div>
      )}

      {isOverallModalOpen && (
        <div className="modal-backdrop" onClick={closeOverallReportModal}>
          <div className="modal-content-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold">Overall Report for {booking.course?.title}</h2>
              <button onClick={closeOverallReportModal} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            <p className="text-sm text-gray-600 mb-3">Student: {booking.student?.name}</p>
            <OverallBookingReportForm booking={booking} onSubmit={(id, data) => handleOverallReportSubmit(id, data)} onCancel={closeOverallReportModal} isSubmittingReport={isSubmittingReport} />
          </div>
        </div>
      )}
    </div>
  );
}