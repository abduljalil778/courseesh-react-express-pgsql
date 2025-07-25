// src/pages/MyCourseProgress.jsx
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookingById, api } from '../lib/api';
import CourseProgressSkeleton from '@/components/skeleton/CourseProgressSkeleton';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import AttendanceButton from '../components/AttendanceButton';
import CourseReviewForm from '../components/CourseReviewForm';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ChatWindow from '../components/ChatWindow';
import { MessageSquare, ArrowLeft, Lock } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import StarRating from '@/components/StarRating';

export default function MyCourseProgress() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submittingAttendanceSessionId, setSubmittingAttendanceSessionId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fungsi untuk mengambil data, dibungkus useCallback agar stabil
  const fetchBookingDetails = useCallback(async () => {
    // Tidak perlu setIsLoading di sini agar refresh data terasa mulus
    try {
      const response = await getBookingById(bookingId);
      setBooking(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reload booking details.');
    }
  }, [bookingId]);

  // useEffect HANYA untuk memuat data awal
  useEffect(() => {
    if (!bookingId) {
      setError("Booking ID is missing.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    fetchBookingDetails().finally(() => {
      setIsLoading(false);
    });
  }, [bookingId, fetchBookingDetails]);


  const handleMarkAttendance = async (sessionId, attendedStatus) => {
    setSubmittingAttendanceSessionId(sessionId);
    try {
      await api.put(`/bookingsessions/${sessionId}/student-attendance`, { attended: attendedStatus });
      await Swal.fire('Success', 'Attendance marked!', 'success');
      await fetchBookingDetails();
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
         await fetchBookingDetails();
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

  if (isLoading) return <CourseProgressSkeleton/>;

  if (error) return <div className="p-6 text-center text-red-500">{error}</div>;
  
  if (!booking) return <div className="p-6 text-center text-gray-500">Booking not found.</div>;

  const canChat = booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED';


  return (
    <>
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <Button onClick={() => navigate('/student')} variant='ghost'>
            Home
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <Button onClick={() => navigate(-1)} variant='ghost'>
            Daftar Kursus
          </Button>
        </BreadcrumbItem>
        <BreadcrumbSeparator/>
        <BreadcrumbItem>
          <BreadcrumbPage>
            Sesi Kursus
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{booking.course?.title}</h1>
            <p className="mt-1 text-muted-foreground">Oleh: {booking.course?.teacher?.name}</p>
          </div>
          {/* --- TOMBOL CHAT --- */}
          {canChat && booking.conversation?.id && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat dengan Instruktur
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="p-4 border-b">
                  <DialogTitle>Chat: {booking.course?.title}</DialogTitle>
                </DialogHeader>
                <ChatWindow conversationId={booking.conversation.id} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      
      {/* --- KARTU DETAIL SESI --- */}
      <Card>
        <CardHeader>
          <CardTitle>Detail & Laporan Sesi</CardTitle>
          <CardDescription>
            Status Booking: <span className="font-semibold text-indigo-600">{getBookingDisplayStatusText(booking)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {booking.sessions?.length > 0 ? (
            <ul className="space-y-4">
              {booking.sessions.map((session, index) => (
                <li key={session.id} className={`p-4 border rounded-lg ${session.isUnlocked ? 'bg-white' : 'bg-gray-100'}`}>
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
                {!session.isUnlocked && <Lock className="h-3 w-3 text-gray-400 inline-block ml-1.5" title="Locked"/>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No sessions scheduled for this booking.</p>
          )}
        </CardContent>
      </Card>
      
      {/* --- KARTU LAPORAN AKHIR & REVIEW --- */}
      {(booking.overallTeacherReport || booking.bookingStatus === 'COMPLETED') && (
        <Card>
          <CardHeader>
            <CardTitle>Laporan Akhir & Ulasan</CardTitle>
          </CardHeader>
          <CardContent>
            {booking.overallTeacherReport && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-2">Laporan Akhir dari Guru</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm whitespace-pre-wrap">{booking.overallTeacherReport}</div>
              </div>
            )}
            {booking.bookingStatus === 'COMPLETED' && !booking.review && (
                <CourseReviewForm booking={booking} onSubmit={handleSubmitReview} isSubmittingReview={submittingReview} />
            )}
            {booking.review && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Ulasan Anda</h4>
                  <div className="p-4 border rounded-md bg-green-50">
                    <StarRating rating={booking.review.rating} size={20} />
                    <p className="text-sm text-gray-600 italic mt-2">"{booking.review.comment}"</p>
                  </div>
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
    </>
  );
}