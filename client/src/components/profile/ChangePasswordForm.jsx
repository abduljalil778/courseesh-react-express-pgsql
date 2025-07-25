// src/components/profile/ChangePasswordForm.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePassword } from '@/lib/api'; // Anda perlu buat API ini
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/Spinner';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ["confirmPassword"], // Tampilkan error di field konfirmasi
});

export default function ChangePasswordForm({ onSuccess }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const handlePasswordChange = async (data) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      reset();

      if (onSuccess) {
        onSuccess();
      }
      
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Could not change password.", "error");
    }
  };

  return (
     <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Password Saat Ini</Label>
        <Input id="currentPassword" type="password" {...register('currentPassword')} />
        {errors.currentPassword && <p className="text-sm text-red-500">{errors.currentPassword.message}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="newPassword">Password Baru</Label>
        <Input id="newPassword" type="password" {...register('newPassword')} />
        {errors.newPassword && <p className="text-sm text-red-500">{errors.newPassword.message}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
        <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>
      <div className="flex justify-start">
        <Button type="submit" disabled={isSubmitting}>
           {isSubmitting ? <Spinner size={20} className="mr-2" /> : 'Ubah Password'}
        </Button>
      </div>
     </form>
  );
}