// client/src/components/PayoutSettingsForm.jsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { updateMyPayoutInfo } from '@/lib/api';
import Swal from 'sweetalert2';
import Spinner from './Spinner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

const payoutSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  bankAccountHolder: z.string().min(1, 'Account holder name is required'),
  bankAccountNumber: z.string().min(1, 'Account number is required'),
});

export default function PayoutSettingsForm() {
  const { user, updateUserContext } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(payoutSchema),
    defaultValues: {
      bankName: user?.bankName || '',
      bankAccountHolder: user?.bankAccountHolder || '',
      bankAccountNumber: user?.bankAccountNumber || '',
    }
  });

  const onSubmit = async (data) => {
    try {
      const response = await updateMyPayoutInfo(data);
      updateUserContext(response.data); // Update context agar data langsung sinkron
      Swal.fire('Success!', 'Your payout information has been updated.', 'success');
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || 'Failed to update information.', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="bankName">Bank Name</Label>
        <Input id="bankName" {...register('bankName')} placeholder="e.g., Bank Central Asia (BCA)" />
        {errors.bankName && <p className="text-sm text-red-500 mt-1">{errors.bankName.message}</p>}
      </div>
      <div>
        <Label htmlFor="bankAccountHolder">Account Holder Name</Label>
        <Input id="bankAccountHolder" {...register('bankAccountHolder')} placeholder="Full name as per bank account" />
        {errors.bankAccountHolder && <p className="text-sm text-red-500 mt-1">{errors.bankAccountHolder.message}</p>}
      </div>
      <div>
        <Label htmlFor="bankAccountNumber">Account Number</Label>
        <Input id="bankAccountNumber" {...register('bankAccountNumber')} placeholder="e.g., 1234567890" />
        {errors.bankAccountNumber && <p className="text-sm text-red-500 mt-1">{errors.bankAccountNumber.message}</p>}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          Save Payout Information
        </Button>
      </div>
    </form>
  );
}