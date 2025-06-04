// src/pages/StudentCourseProgress.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllBookings, api, createCourseReview } from '../lib/api'; // Asumsi api.js bisa POST/PUT
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { format, parseISO, isFuture, isPast } from 'date-fns';
// Mungkin perlu form untuk review: import ReviewForm from '../components/ReviewForm';

// Komponen kecil untuk form presensi (sangat sederhana)
const AttendanceButton = ({ session, onMarkAttendance, submittingAttendanceSessionId }) => {
  // Logika untuk menentukan apakah tombol presensi harus ditampilkan/diaktifkan:
  // - Sesi harus sudah terbuka (isUnlocked)
  // - Status sesi idealnya SCHEDULED (belum dimulai atau belum di-report guru)
  // - Siswa belum menandai kehadirannya ATAU belum ada laporan dari guru
  // Ini bisa disesuaikan dengan aturan bisnis Anda.
  const canMark = session.isUnlocked && session.status === 'SCHEDULED' && session.studentAttendance === null;

  if (!canMark) {
    if (session.studentAttendance !== null) {
      return <span className={`text-xs px-2 py-1 rounded-full ${session.studentAttendance ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {session.studentAttendance ? 'You: Present' : 'You: Absent'}
      </span>;
    }
    return null; // Atau tampilkan status sesi jika sudah tidak SCHEDULED
  }

  return (
    <button
      onClick={() => onMarkAttendance(session.id, true)} // Asumsi siswa hanya bisa mark "Present"
      disabled={submittingAttendanceSessionId === session.id}
      className="px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600 disabled:bg-gray-400"
    >
      {submittingAttendanceSessionId === session.id ? <Spinner size={12} /> : 'Mark Present'}
    </button>
  );
};

// Komponen untuk Form Review (contoh sederhana)
const CourseReviewForm = ({ bookingId, courseId, teacherId, onSubmitReview, isSubmittingReview }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            Swal.fire("Rating Required", "Please select a rating.", "warning");
            return;
        }
        onSubmitReview(bookingId, { rating, comment, courseId, teacherId });
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded-md bg-gray-50 space-y-3">
            <h4 className="font-semibold text-md">Rate this Course</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700">Rating (1-5 stars):</label>
                <div className="flex space-x-1 mt-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button 
                            type="button" 
                            key={star} 
                            onClick={() => setRating(star)}
                            className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        >
                            ★
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <label htmlFor={`comment-${bookingId}`} className="block text-sm font-medium text-gray-700">Comment (Optional):</label>
                <textarea
                    id={`comment-${bookingId}`}
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                    placeholder="Share your experience..."
                />
            </div>
            <button 
                type="submit" 
                disabled={isSubmittingReview}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
                {isSubmittingReview ? <Spinner size={18} /> : 'Submit Review'}
            </button>
        </form>
    );
};


export default function StudentCourseProgress() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingAttendanceSessionId, setSubmittingAttendanceSessionId] = useState(null);
  const [submittingReviewBookingId, setSubmittingReviewBookingId] = useState(null);

  const loadStudentBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings(); // API ini harus mengembalikan booking milik student yang login
      setBookings(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course progress.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudentBookings();
  }, [loadStudentBookings]);

  const handleMarkAttendance = async (sessionId, attendedStatus) => {
    setSubmittingAttendanceSessionId(sessionId);
    try {
      // Panggil API baru untuk student attendance
      await api.put(`/bookingsessions/${sessionId}/student-attendance`, { attended: attendedStatus });
      Swal.fire('Success', 'Attendance marked!', 'success');
      loadStudentBookings(); // Reload data
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to mark attendance.', 'error');
    } finally {
      setSubmittingAttendanceSessionId(null);
    }
  };
  
  const handleSubmitReview = async (bookingId, reviewData) => {
    setSubmittingReviewBookingId(bookingId);
    try {
        await createCourseReview(bookingId, reviewData);
        Swal.fire('Review Submitted!', 'Thank you for your feedback.', 'success');
        loadStudentBookings(); // Reload untuk menampilkan review atau menyembunyikan form
    } catch (err) {
        Swal.fire('Error', err.response?.data?.message || 'Failed to submit review.', 'error');
    } finally {
        setSubmittingReviewBookingId(null);
    }
  };


  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={loadStudentBookings} className="text-blue-500 underline ml-2">Retry</button></div>;
  if (!bookings.length) return <div className="p-6 text-center text-gray-500">You have no active courses or past progress to show.</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
        My Course Progress & Schedule
      </h1>
      <div className="space-y-8">
        {bookings.map(booking => (
          <div key={booking.id} className="bg-white shadow-xl rounded-lg p-5 md:p-6">
            <div className="border-b pb-3 mb-3">
              <h2 className="text-xl font-semibold text-indigo-700">{booking.course?.title}</h2>
              <p className="text-sm text-gray-600">Teacher: {booking.course?.teacher?.name}</p>
              <p className={`text-sm font-medium ${booking.bookingStatus === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'}`}>
                Status Kursus: {booking.bookingStatus}
              </p>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-700 mb-2">Schedules & Reports:</h3>
              {booking.sessions && booking.sessions.length > 0 ? (
                <ul className="space-y-3">
                  {booking.sessions.map((session, index) => (
                    <li key={session.id} className={`p-3 border rounded-md ${session.isUnlocked ? 'bg-blue-50' : 'bg-gray-100 opacity-80'}`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start mb-1">
                        <div className="text-sm">
                          <span className="font-medium">Session {index + 1}:</span> {format(parseISO(session.sessionDate), 'EEEE, dd MMM yyyy, HH:mm')}
                          {!session.isUnlocked && <i className="fas fa-lock text-xs text-gray-400 ml-2" title="Locked"></i>}
                           {session.isUnlocked && session.status==='SCHEDULED' && isFuture(parseISO(session.sessionDate)) && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">Upcoming</span>
                           )}
                           {session.isUnlocked && session.status==='SCHEDULED' && isPast(parseISO(session.sessionDate)) && !session.teacherReport && (
                                <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Awaiting Report</span>
                           )}
                           {session.status && session.status !== 'SCHEDULED' && (
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full capitalize ${
                                    session.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                    session.status === 'STUDENT_ABSENT' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>{session.status.replace('_',' ')}</span>
                           )}
                        </div>
                        {session.isUnlocked && session.status === 'SCHEDULED' && (
                          <AttendanceButton 
                            session={session} 
                            onMarkAttendance={handleMarkAttendance}
                            submittingAttendanceSessionId={submittingAttendanceSessionId}
                          />
                        )}
                      </div>
                      {session.isUnlocked && session.teacherReport && (
                        <div className="mt-1 pt-2 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700">Teacher's Note:</p>
                          <p className="text-xs text-gray-600 whitespace-pre-wrap">{session.teacherReport}</p>
                        </div>
                      )}
                       {session.isUnlocked && session.studentAttendance !== null && (
                        <p className="text-xs text-gray-500 mt-1">
                            Your Attendance: {session.studentAttendance ? 
                            <span className="font-semibold text-green-600">Present</span> : 
                            <span className="font-semibold text-red-600">Absent</span>}
                            {session.status !== 'SCHEDULED' && session.status !== 'COMPLETED' && " (Teacher's record)"}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 italic">No sessions scheduled yet.</p>
              )}
            </div>

            {booking.overallTeacherReport && (
              <div className="mt-4 pt-3 border-t">
                <h3 className="text-md font-semibold text-gray-700 mb-1">Overall Course Report from Teacher:</h3>
                <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-md whitespace-pre-wrap">{booking.overallTeacherReport}</p>
                {booking.finalGrade && <p className="text-sm mt-1"><strong>Final Grade:</strong> {booking.finalGrade}</p>}
              </div>
            )}

            {booking.bookingStatus === 'COMPLETED' && !booking.review && ( // Jika kursus selesai dan belum direview
                <CourseReviewForm 
                    bookingId={booking.id} 
                    courseId={booking.courseId}
                    teacherId={booking.course.teacherId} // Pastikan teacherId ada di booking.course
                    onSubmitReview={handleSubmitReview}
                    isSubmittingReview={submittingReviewBookingId === booking.id}
                />
            )}
            {booking.review && (
                <div className="mt-4 p-3 border rounded-md bg-green-50">
                    <h4 className="font-semibold text-sm text-green-700">Your Review:</h4>
                    <div className="flex items-center my-1">
                        {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xl ${i < booking.review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                        ))}
                    </div>
                    {booking.review.comment && <p className="text-xs text-gray-600 italic">"{booking.review.comment}"</p>}
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}