// src/components/SessionReportForm.jsx
import React, {useEffect, useState} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from './Spinner';
import {sessionReportSchema, SESSION_STATUSES} from '../schemas/sessionReportSchema';


export default function SessionReportForm({ session, onSubmit, onCancel, isSubmittingReport }) {
  // State untuk menangani file upload secara terpisah
  const [sessionFile, setSessionFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(sessionReportSchema),
    // Logika default value disederhanakan di sini
    defaultValues: {
      teacherReport: session?.teacherReport || '',
      studentAttendance: session?.studentAttendance ?? true,
      status: session?.status || 'SCHEDULED',
    },
  });
  
  // useEffect untuk me-reset form jika prop `session` berubah.
  useEffect(() => {
    reset({
      teacherReport: session?.teacherReport || '',
      studentAttendance: session?.studentAttendance ?? true,
      status: session?.status || 'SCHEDULED',
    });
  }, [session, reset]);


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSessionFile(e.target.files[0]);
    } else {
      setSessionFile(null);
    }
  };

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      sessionFile: sessionFile, // Tambahkan file dari state
    };
    onSubmit(session.id, payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Input Teacher Report */}
      <div>
        <label htmlFor="teacherReport" className="block text-sm font-medium text-gray-700 mb-1">
          Session Report / Notes
        </label>
        <textarea
          id="teacherReport"
          {...register('teacherReport')}
          rows="4"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Enter notes about the session, student's progress, learning materials, etc."
        />
        {errors.teacherReport && <p className="text-red-500 text-xs mt-1">{errors.teacherReport.message}</p>}
      </div>
      
      {/* Input Student Attendance & Session Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="studentAttendance" className="block text-sm font-medium text-gray-700 mb-1">
            Student Attendance *
          </label>
          <select
            id="studentAttendance"
            {...register('studentAttendance', { setValueAs: (v) => v === 'true' })}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
          >
            <option value="true">Present</option>
            <option value="false">Absent</option>
          </select>
          {errors.studentAttendance && <p className="text-red-500 text-xs mt-1">{errors.studentAttendance.message}</p>}
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Session Status *
          </label>
          <select
            id="status"
            {...register('status')}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white"
          >
            {SESSION_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
          {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
        </div>
      </div>
      
      {/* Input File Upload */}
      <div>
        <label htmlFor="sessionFile" className="block text-sm font-medium text-gray-700 mb-1">
          Upload Document (Optional)
        </label>
        <input
          type="file"
          id="sessionFile"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {session.teacherUploadedFile && (
            <div className="mt-2 text-xs">
                <span className="text-gray-600">Current file: </span>
                <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${session.teacherUploadedFile}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    View Uploaded File
                </a>
            </div>
        )}
      </div>

      {/* Tombol Aksi */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
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