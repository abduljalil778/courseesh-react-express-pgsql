// src/components/SessionReportForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Spinner from './Spinner';
// Impor enum SessionStatus jika Anda ingin dropdown yang dinamis dari Prisma Client (membutuhkan sedikit trik untuk frontend)
// atau definisikan secara manual di frontend:
const SESSION_STATUSES = ['SCHEDULED', 'COMPLETED', 'CANCELLED_TEACHER', 'CANCELLED_STUDENT', 'STUDENT_ABSENT'];


// Skema Zod disesuaikan dengan apa yang dikirim
const sessionReportSchema = z.object({
  teacherReport: z.string().optional().or(z.literal('')),
  studentAttendance: z.boolean().optional(),
  status: z.enum(SESSION_STATUSES).optional(),
});

export default function SessionReportForm({ session, onSubmit, onCancel, isSubmittingReport }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch, // Untuk melihat nilai field jika perlu
  } = useForm({
    resolver: zodResolver(sessionReportSchema),
    defaultValues: {
      teacherReport: session?.teacherReport || '',
      studentAttendance: session?.studentAttendance === null || session?.studentAttendance === undefined ? true : session.studentAttendance, // Default hadir jika belum diisi
      status: session?.status || 'SCHEDULED',
    },
  });

  const watchedStatus = watch('status');

  const handleFormSubmit = (data) => {
    const payload = { ...data };
    // Jika status tidak diubah dan defaultnya SCHEDULED, mungkin tidak perlu dikirim jika tidak diubah
    // atau selalu kirim status saat ini.
    // Jika studentAttendance tidak disentuh, default boolean mungkin sudah cukup.
    onSubmit(session.id, payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="teacherReport" className="block text-sm font-medium text-gray-700 mb-1">
          Session Report / Notes
        </label>
        <textarea
          id="teacherReport"
          {...register('teacherReport')}
          rows="4"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter notes about the session, student's progress, homework, etc."
        />
        {errors.teacherReport && <p className="text-red-500 text-xs mt-1">{errors.teacherReport.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="studentAttendance" className="block text-sm font-medium text-gray-700 mb-1">
            Student Attendance
          </label>
          <select
            id="studentAttendance"
            {...register('studentAttendance', { setValueAs: (value) => value === 'true' })}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="true">Present</option>
            <option value="false">Absent</option>
          </select>
          {errors.studentAttendance && <p className="text-red-500 text-xs mt-1">{errors.studentAttendance.message}</p>}
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Session Status
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            {SESSION_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>
          {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmittingReport}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmittingReport}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-70 flex items-center"
        >
          {isSubmittingReport && <Spinner size={18} className="mr-2" />}
          {isSubmittingReport ? 'Saving...' : 'Save Session Report'}
        </button>
      </div>
    </form>
  );
}