import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from '../Spinner';
import { paymentOptionSchema } from '../../schemas/paymentOptionSchema';


export default function PaymentOptionForm({ initialData = null, onSubmit, onCancel, isSubmitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentOptionSchema),
    defaultValues: {
      bankName: initialData?.bankName || '',
      accountHolder: initialData?.accountHolder || '',
      accountNumber: initialData?.accountNumber || '',
      logoUrl: initialData?.logoUrl || '',
      isActive: initialData?.isActive === false ? false : true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Bank Name *</label>
        <input type="text" id="bankName" {...register('bankName')} className="mt-1 w-full p-2 border rounded-md" />
        {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName.message}</p>}
      </div>
      <div>
        <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700">Account Holder *</label>
        <input type="text" id="accountHolder" {...register('accountHolder')} className="mt-1 w-full p-2 border rounded-md" />
        {errors.accountHolder && <p className="text-red-500 text-xs mt-1">{errors.accountHolder.message}</p>}
      </div>
      <div>
        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number *</label>
        <input type="text" id="accountNumber" {...register('accountNumber')} className="mt-1 w-full p-2 border rounded-md" />
        {errors.accountNumber && <p className="text-red-500 text-xs mt-1">{errors.accountNumber.message}</p>}
      </div>
      <div>
        <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">Bank Logo URL</label>
        <input type="text" id="logoUrl" {...register('logoUrl')} className="mt-1 w-full p-2 border rounded-md" />
        {errors.logoUrl && <p className="text-red-500 text-xs mt-1">{errors.logoUrl.message}</p>}
      </div>
      <div className="flex items-center">
        <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded" />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Active</label>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center">
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          {initialData ? 'Update Option' : 'Create Option'}
        </button>
      </div>
    </form>
  );
}