// src/components/AttendanceButton.jsx
import Spinner from './Spinner';
import {isToday, parseISO} from 'date-fns';

export default function AttendanceButton({ session, bookingStatus, onMarkAttendance, submittingAttendanceSessionId }) {
  // Kondisi #1: Tampilkan status final jika guru sudah mengisi laporan
  // Kita tahu laporan final jika status sesi BUKAN lagi 'SCHEDULED'.
  if (session.status !== 'SCHEDULED') {
    return (
      <div className="text-sm font-medium text-right">
        <span className="text-gray-600">Attendance: </span>
        <span className={session.studentAttendance ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {session.studentAttendance ? 'Present' : 'Absent'}
        </span>
      </div>
    );
  }

  // Kondisi #2: Siswa sudah menandai kehadiran, tapi guru belum (status masih 'SCHEDULED')
  if (session.studentAttendance !== null) {
    return (
      <div className="text-sm font-medium text-right">
        <span className="text-gray-600">Your Mark: </span>
        <span className={session.studentAttendance ? 'text-green-600' : 'text-red-600'}>
          {session.studentAttendance ? 'Present' : 'Absent'}
        </span>
      </div>
    );
  }
  
  // Kondisi #3: Siswa bisa melakukan presensi
  // Syarat: Sesi unlocked, booking confirmed, dan status sesi masih scheduled
  const canStudentMark = session.isUnlocked && bookingStatus === 'CONFIRMED' && session.status === 'SCHEDULED' && isToday(parseISO(session.sessionDate));
  
  if (canStudentMark) {
    return (
      <button
        onClick={() => onMarkAttendance(session.id, true)} // Siswa hanya bisa mark 'Present'
        disabled={submittingAttendanceSessionId === session.id}
        className="px-3 py-1.5 text-xs text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
      >
        {submittingAttendanceSessionId === session.id ? <Spinner size={16} /> : 'Mark as Present'}
      </button>
    );
  }

  // Kondisi #4: Tombol presensi tidak aktif karena syarat tidak terpenuhi
  return (
    <button
      disabled={true}
      className="px-3 py-1.5 text-xs text-white bg-gray-400 rounded-md cursor-not-allowed"
      title="Attendance can be marked after booking is confirmed by the teacher."
    >
      Mark as Present
    </button>
  );
}