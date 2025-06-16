// src/pages/MyCourseProgress.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, api } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO, } from 'date-fns';
import AttendanceButton from '../components/AttendanceButton';
import CourseReviewForm from '../components/CourseReviewForm';

export default function MyCourseProgress() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingAttendanceSessionId, setSubmittingAttendanceSessionId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setIsLoading(false);
      return;
    }
    if (!booking) setIsLoading(true);
    setError(null);
    try {
      const response = await getBookingById(bookingId);
      setBooking(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking details.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, booking]);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]); 

  const handleMarkAttendance = async (sessionId, attendedStatus) => {
    setSubmittingAttendanceSessionId(sessionId);
    try {
      await api.put(`/bookingsessions/${sessionId}/student-attendance`, { attended: attendedStatus });
      await Swal.fire('Success', 'Attendance marked!', 'success');
      fetchBookingDetails();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to mark attendance.', 'error');
    } finally {
      setSubmittingAttendanceSessionId(null);
    }
  };
  
  const handleSubmitReview = async (currentBookingId, reviewData) => {
     setSubmittingReview(true);
     try {
         await api.post(`/bookings/${currentBookingId}/review`, reviewData);
         await Swal.fire('Review Submitted!', 'Thank you for your feedback.', 'success');
         fetchBookingDetails();
     } catch (err) {
         Swal.fire('Error', err.response?.data?.message || 'Failed to submit review.', 'error');
     } finally {
         setSubmittingReview(false);
     }
  };

 const getBookingDisplayStatusText = (currentBooking) => {
     if (!currentBooking) return "";
     const hasPaidPayment = currentBooking.payments?.some(p => p.status === 'PAID');
     if (currentBooking.bookingStatus === 'PENDING') {
       return !hasPaidPayment ? 'Waiting for Payment' : 'Waiting Teacher Confirmation';
     }
     return currentBooking.bookingStatus;
 };

  if (isLoading) return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={fetchBookingDetails} className="text-blue-500 underline ml-2">Retry</button></div>;
  if (!booking) return <div className="p-6 text-center text-gray-500">Booking not found or could not be loaded.</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <button onClick={() => navigate('/student/my-courses')} className="mb-4 text-sm text-indigo-600 hover:underline">
        &larr; Back to My Courses
      </button>
      <div className="bg-white shadow-xl rounded-lg p-5 md:p-8">
        <div className="border-b pb-4 mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-700">{booking.course?.title}</h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p><strong>Teacher:</strong> {booking.course?.teacher?.name}</p>
            <p><strong>Contact Teacher:</strong> {booking.course?.teacher?.phone || 'Not Available'}</p>
          </div>
          <p className={`text-md font-medium mt-2`}>
            Booking Status: 
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                booking.bookingStatus === 'COMPLETED' ? 'bg-green-100 text-green-700' : 
                booking.bookingStatus === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : 
                'bg-orange-100 text-orange-700'
              }`}>
              {getBookingDisplayStatusText(booking)}
            </span>
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Session Details & Reports:</h3>
          {booking.sessions && booking.sessions.length > 0 ? (
            <ul className="space-y-4">
              {booking.sessions.map((session, index) => (
                <li key={session.id} className={`p-4 border rounded-lg ${session.isUnlocked ? 'bg-white shadow-sm' : 'bg-gray-100 opacity-80'}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                    <div className="text-sm flex-grow">
                      <p className="font-semibold text-gray-800">Session {index + 1}: {format(parseISO(session.sessionDate), 'EEEE, dd MMMM yyyy, HH:mm')}</p>
                      <p className={`text-xs font-medium capitalize mt-0.5 ${
                          session.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        Status: {(session.status || 'SCHEDULED').replace(/_/g, ' ')}
                        {!session.isUnlocked && <i className="fas fa-lock text-xs text-gray-400 ml-1.5" title="Locked"></i>}
                      </p>
                    </div>
                  </div>
                  
                  {session.isUnlocked && session.teacherReport && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700">Teacher's Note for this session:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">{session.teacherReport}</p>
                    </div>
                  )}

                  {session.isUnlocked && session.teacherUploadedFile && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700">Attachment from Teacher:</p>
                          <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${session.teacherUploadedFile}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 mt-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
                              <i className="fas fa-download mr-2"></i> Download Attachment
                          </a>
                      </div>
                  )}

                  {session.isUnlocked && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="mt-2 flex items-center justify-end">
                         <AttendanceButton 
                           session={session} 
                           bookingStatus={booking.bookingStatus}
                           onMarkAttendance={handleMarkAttendance}
                           submittingAttendanceSessionId={submittingAttendanceSessionId}
                         />
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No sessions scheduled for this booking.</p>
          )}
        </div>
        
         {booking.overallTeacherReport && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Overall Course Report</h3>
            <div className="bg-yellow-50 p-4 rounded-md text-gray-700">
               <p className="text-sm whitespace-pre-wrap">{booking.overallTeacherReport}</p>
               {booking.finalGrade && <p className="text-sm mt-2"><strong>Final Grade:</strong> {booking.finalGrade}</p>}
            </div>
          </div>
        )}

        {booking.bookingStatus === 'COMPLETED' && !booking.review && (
            <CourseReviewForm 
                booking={booking}
                onSubmit={handleSubmitReview}
                isSubmittingReview={submittingReview}
            />
        )}
        {booking.review && (
            <div className="mt-6 pt-6 border-t">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Review</h3>
                <div className="p-4 border rounded-md bg-green-50">
                    <div className="flex items-center mb-1">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-2xl ${i < booking.review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                    </div>
                    {booking.review.comment && <p className="text-sm text-gray-600 italic">"{booking.review.comment}"</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
