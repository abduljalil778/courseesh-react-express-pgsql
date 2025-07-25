// src/pages/TeacherBookingManageDetail.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getBookingById,
  updateSessionReport,
  submitOverallBookingReport,
} from '../lib/api';
import CourseProgressSkeleton from '@/components/skeleton/CourseProgressSkeleton';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import SessionReportForm from '../components/SessionReportForm';
import OverallBookingReportForm from '../components/OverallBookingReportForm';

// --- Impor Komponen Baru ---
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ChatWindow from '../components/ChatWindow';
import { MessageSquare, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const SESSION_STATUS_COMPLETED = 'COMPLETED';

export default function TeacherScheduleDetails() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isOverallModalOpen, setIsOverallModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Fetching Data
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
    if (!bookingToCheck || !bookingToCheck.sessions) return false;
    if (bookingToCheck.sessions.length === 0) return false;
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

  // HANDLE SUBMIT DIPERBARUI UNTUK FORM DATA
  const handleSessionReportSubmit = async (sessionId, data) => {
    setIsSubmittingReport(true);
    try {
      await updateSessionReport(sessionId, data); 
      await Swal.fire('Success', 'Session report saved!', 'success');
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
      await Swal.fire('Success', 'Overall report saved!', 'success');
      closeOverallReportModal();
      fetchBookingDetails(); // Reload data
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save overall report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  
  
  
  if (isLoading) return <CourseProgressSkeleton />;

  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={fetchBookingDetails} className="text-blue-500 underline ml-2">Retry</button></div>;
  
  if (!booking) return <div className="p-6 text-center text-gray-500">Booking not found.</div>;
  
  const canChat = booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED';
  const allSessionsDone = booking.sessions?.every(s => s.status === 'COMPLETED');

  return (
    <>
      <div>
      <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button onClick={() => navigate('/teacher')} variant='ghost'>Home</Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <Button onClick={() => navigate(-1)} variant='ghost'>Daftar Kursus</Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage>Detail Sesi</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{booking.course?.title}</h1>
            <p className="mt-1 text-muted-foreground">Siswa: {booking.student?.name}</p>
          </div>
          {canChat && (
            <Dialog>
              <DialogTrigger asChild>
                <Button><MessageSquare className="h-4 w-4 mr-2" />Chat dengan Siswa</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl p-0">
                <DialogHeader className="p-4 border-b"><DialogTitle>Chat: {booking.course?.title}</DialogTitle></DialogHeader>
                <ChatWindow conversationId={booking.conversation?.id} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* --- LAYOUT DUA KOLOM --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* KOLOM KIRI: DETAIL SESI */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Sesi & Laporan</CardTitle>
              <CardDescription>
                {booking.sessions?.filter(s => s.status === 'COMPLETED').length || 0} / {booking.sessions.length} sesi selesai
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {booking.sessions.map((session, index) => (
                  <li key={session.id} className="p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div className="flex-grow">
                      <p className="font-semibold text-gray-800">Sesi {index + 1}: {format(parseISO(session.sessionDate), 'EEEE, dd MMM yyyy, HH:mm')}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant={session.status === 'COMPLETED' ? 'default' : 'secondary'}>{(session.status || 'SCHEDULED')}</Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          {session.studentAttendance ? <CheckCircle className="h-4 w-4 text-green-500" /> : ''}
                          {session.studentAttendance !== null ? (session.studentAttendance ? 'Siswa Hadir' : 'Siswa Tidak Hadir') : 'Presensi belum diisi'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-0 flex-shrink-0">
                      <Button onClick={() => openSessionReportModal(session)} disabled={!session.isUnlocked} size="sm">
                        {session.teacherReport ? 'Lihat/Edit Laporan' : 'Tambah Laporan'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: LAPORAN AKHIR */}
        <div className="lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Evaluasi & Laporan Akhir</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.overallTeacherReport ? (
                <div className="text-sm space-y-2">
                  <p className="whitespace-pre-wrap text-gray-700">{booking.overallTeacherReport}</p>
                  {booking.finalGrade && <p className="mt-2"><strong>Nilai Akhir:</strong> <Badge>{booking.finalGrade}</Badge></p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Belum ada laporan akhir.</p>
              )}
            </CardContent>
            <CardFooter>
               <Button onClick={openOverallReportModal} disabled={!allSessionsDone} className="w-full">
                 {booking.overallTeacherReport ? 'Edit Laporan Akhir' : 'Buat Laporan Akhir'}
               </Button>
            </CardFooter>
          </Card>
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
    </>
  );
}