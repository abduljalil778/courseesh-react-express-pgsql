// src/components/PayoutUpdateForm.jsx
import React, {useState} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Spinner from './Spinner';
import { format, parseISO } from 'date-fns';

// Definisikan enum PayoutStatus di frontend agar konsisten atau impor jika memungkinkan (biasanya tidak dari backend langsung)
const PAYOUT_STATUSES = ['PENDING_PAYMENT', 'PAID', 'FAILED']; 

const payoutUpdateSchema = z.object({
  status: z.enum(PAYOUT_STATUSES, { required_error: "Status is required" }),
  payoutDate: z.string().optional().nullable()
    .refine(val => val === null || val === '' || !isNaN(new Date(val).getTime()), {
        message: "Invalid date format. Leave empty or provide YYYY-MM-DD.",
    })
    .transform(val => (val && val !== '') ? new Date(val).toISOString() : null),
  payoutTransactionRef: z.string().optional().nullable().transform(val => val === '' ? null : val),
  adminNotes: z.string().optional().nullable().transform(val => val === '' ? null : val),
});

export default function PayoutUpdateForm({ payout, onSubmit, onCancel, isSubmitting }) {
  const [proofFile, setProofFile] = useState(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(payoutUpdateSchema),
    defaultValues: {
      status: payout?.status || 'PENDING_PAYMENT',
      payoutDate: payout?.payoutDate ? format(parseISO(payout.payoutDate), 'yyyy-MM-dd') : '',
      payoutTransactionRef: payout?.payoutTransactionRef || '',
      adminNotes: payout?.adminNotes || '',
    },
  });

  const watchedStatus = watch("status");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
    }
  };

  const handleFormSubmit = (data) => {
    const payload = { ...data };
    if (payload.status !== 'PAID' || !payload.payoutDate) {
      payload.payoutDate = null;
    }
    if (proofFile) {
      payload.adminProof = proofFile;
    }
    onSubmit(payout.id, payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Payout Status <span className="text-red-500">*</span></label>
        <select
          id="status"
          {...register('status')}
          className={`w-full p-2.5 border rounded-md ${errors.status ? 'border-red-500' : 'border-gray-300'} shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500`}
        >
          {PAYOUT_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        {errors.status && <p className="text-red-600 text-xs mt-1">{errors.status.message}</p>}
      </div>

      {/* Hanya tampilkan input tanggal jika statusnya PAID */}
      {(watchedStatus === 'PAID') && (
        <div>
          <label htmlFor="payoutDate" className="block text-sm font-medium text-gray-700 mb-1">Payout Date <span className="text-red-500">*</span></label>
          <input
            type="date"
            id="payoutDate"
            {...register('payoutDate', { required: watchedStatus === 'PAID' })}
            className={`w-full p-2.5 border rounded-md ${errors.payoutDate ? 'border-red-500' : 'border-gray-300'} shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500`}
          />
          {errors.payoutDate && <p className="text-red-600 text-xs mt-1">{errors.payoutDate.message}</p>}
        </div>
      )}


      <div>
        <label htmlFor="payoutTransactionRef" className="block text-sm font-medium text-gray-700 mb-1">Transaction Reference (Optional)</label>
        <input
          type="text"
          id="payoutTransactionRef"
          {...register('payoutTransactionRef')}
          placeholder="e.g., TRN123XYZ"
          className={`w-full p-2.5 border rounded-md ${errors.payoutTransactionRef ? 'border-red-500' : 'border-gray-300'} shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500`}
        />
        {errors.payoutTransactionRef && <p className="text-red-600 text-xs mt-1">{errors.payoutTransactionRef.message}</p>}
      </div>

      <div>
        <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Optional)</label>
        <textarea
          id="adminNotes"
          {...register('adminNotes')}
          rows="3"
          placeholder="Internal notes regarding this payout..."
          className={`w-full p-2.5 border rounded-md ${errors.adminNotes ? 'border-red-500' : 'border-gray-300'} shadow-sm sm:text-sm focus:ring-indigo-500 focus:border-indigo-500`}
        />
        {errors.adminNotes && <p className="text-red-600 text-xs mt-1">{errors.adminNotes.message}</p>}
      </div>

      <div>
        <label htmlFor="adminProof" className="block text-sm font-medium text-gray-700 mb-1">
          Upload Proof of Transfer (Optional)
        </label>
        <input
          type="file"
          id="adminProof"
          onChange={handleFileChange}
          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {payout.adminProofOfPaymentUrl && (
          <div className="mt-2 text-xs">
            <span className="text-gray-600">Current file: </span>
            <a href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${payout.adminProofOfPaymentUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              View Uploaded Proof
            </a>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md border border-gray-300 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-70 flex items-center"
        >
          {isSubmitting && <Spinner size={18} className="mr-2" />}
          {isSubmitting ? 'Saving...' : 'Update Payout'}
        </button>
      </div>
    </form>
  );
}