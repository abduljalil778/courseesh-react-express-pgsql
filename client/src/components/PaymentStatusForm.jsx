// src/components/PaymentStatusForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { paymentStatusSchema } from '../schemas/paymentStatusSchema';
import Spinner from './Spinner';

export default function PaymentStatusForm({ paymentId, currentStatus, onSubmit }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({
      resolver: zodResolver(paymentStatusSchema),
      defaultValues: { paymentStatus: currentStatus }
    });

  const submitHandler = async data => {
    await onSubmit(paymentId, data.paymentStatus);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      <select
        {...register('paymentStatus')}
        className={`w-full p-2 border rounded ${
          errors.paymentStatus ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="PENDING">PENDING</option>
        <option value="PAID">PAID</option>
        <option value="FAILED">FAILED</option>
      </select>
      {errors.paymentStatus && (
        <p className="text-red-600 text-sm mt-1">
          {errors.paymentStatus.message}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? <Spinner size={20}/> : 'Update Status'}
      </button>
    </form>
  );
}
