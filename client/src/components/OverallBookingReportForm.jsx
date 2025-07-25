// src/components/OverallBookingReportForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Spinner from './Spinner';
// Impor enum BookingStatus jika perlu untuk dropdown atau validasi
// const BOOKING_STATUSES_FOR_COMPLETION = ['COMPLETED', 'CONFIRMED']; // Contoh


const overallReportSchema = z.object({
  overallTeacherReport: z.string().optional().or(z.literal('')),
  finalGrade: z.string().optional().or(z.literal('')),
  // bookingStatus: z.enum(BOOKING_STATUSES_FOR_COMPLETION).optional(), // Jika teacher bisa set status booking akhir
});

export default function OverallBookingReportForm({ booking, onSubmit, onCancel, isSubmittingReport }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(overallReportSchema),
    defaultValues: {
      overallTeacherReport: booking?.overallTeacherReport || '',
      finalGrade: booking?.finalGrade || '',
      // bookingStatus: booking?.bookingStatus || undefined,
    },
  });

  const handleFormSubmit = (data) => {
    onSubmit(booking.id, data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="overallTeacherReport" className="block text-sm font-medium text-gray-700 mb-1">
          Overall Course Report / Evaluation
        </label>
        <textarea
          id="overallTeacherReport"
          {...register('overallTeacherReport')}
          rows="5"
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Summarize student's overall performance, achievements, and areas for improvement for the entire course."
        />
        {errors.overallTeacherReport && <p className="text-red-500 text-xs mt-1">{errors.overallTeacherReport.message}</p>}
      </div>

      <div>
        <label htmlFor="finalGrade" className="block text-sm font-medium text-gray-700 mb-1">
          Final Grade / Assessment
        </label>
        <input
          type="text"
          id="finalGrade"
          {...register('finalGrade')}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., A+, Satisfactory, 85/100"
        />
        {errors.finalGrade && <p className="text-red-500 text-xs mt-1">{errors.finalGrade.message}</p>}
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
          {isSubmittingReport ? 'Saving...' : 'Save Overall Report'}
        </button>
      </div>
    </form>
  );
}