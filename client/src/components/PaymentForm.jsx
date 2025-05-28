import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from './Spinner';

// Zod schema
const paymentSchema = z.object({
  bookingId:     z.string().uuid('Booking ID must be a valid UUID'),
  amount:        z.number().positive('Amount must be > 0'),
  paymentDate:   z
    .string()
    .refine(val => !isNaN(Date.parse(val)), { message: 'Must be a valid date/time' }),
  status: z.enum(['PAID', 'FAILED', 'REFUNDED']),
});

export default function PaymentForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      bookingId:     '',
      amount:        "",
      paymentDate:   new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
      status: 'PAID',
    },
  });

  const submitHandler = async (data) => {
    // convert local datetime to ISO
    await onSubmit({
      ...data,
      paymentDate: new Date(data.paymentDate).toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      {/* Booking ID */}
      <div>
        <input
          placeholder="Booking ID"
          {...register('bookingId')}
          className={`w-full p-2 border rounded ${
            errors.bookingId ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.bookingId && (
          <p className="text-red-600 text-sm mt-1">
            {errors.bookingId.message}
          </p>
        )}
      </div>

      {/* Amount */}
      <div>
        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          {...register('amount', { valueAsNumber: true })}
          className={`w-full p-2 border rounded ${
            errors.amount ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.amount && (
          <p className="text-red-600 text-sm mt-1">
            {errors.amount.message}
          </p>
        )}
      </div>

      {/* Payment Date */}
      <div>
        <input
          type="datetime-local"
          {...register('paymentDate')}
          className={`w-full p-2 border rounded ${
            errors.paymentDate ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.paymentDate && (
          <p className="text-red-600 text-sm mt-1">
            {errors.paymentDate.message}
          </p>
        )}
      </div>

      {/* Status */}
      <div>
        <select
          {...register('status')}
          className={`w-full p-2 border rounded ${
            errors.status ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
        {errors.status && (
          <p className="text-red-600 text-sm mt-1">
            {errors.status.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {isSubmitting && <Spinner size={20} />}
        <span>
        {isSubmitting ? 'Processing…' : 'Create Payment'}
        </span>
      </button>
    </form>
  );
}
