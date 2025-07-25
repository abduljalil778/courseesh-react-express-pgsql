// src/components/settings/TeacherProfileSettings.jsx
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUser } from '@/lib/api';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/Spinner';

const teacherProfileSchema = z.object({
  headline: z.string().max(100, 'Headline cannot exceed 100 characters').optional(),
  bio: z.string().max(1000, 'Biography cannot exceed 1000 characters').optional(),
  websiteUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
});

export default function TeacherProfileSettings() {
  const { user, updateUserContext } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(teacherProfileSchema),
    defaultValues: {
      headline: user.headline || '',
      bio: user.bio || '',
      websiteUrl: user.websiteUrl || '',
    },
  });

  const handleUpdate = async (data) => {
    try {
      const response = await updateUser(user.id, data);
      updateUserContext(response.data); // Update context global
      Swal.fire("Success", "Your public profile has been updated!", "success");
    } catch (err) {
      Swal.fire("Update Failed", err.response?.data?.message || "Could not update profile.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleUpdate)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input id="headline" {...register('headline')} placeholder="e.g., Full-Stack Developer & Mentor" />
        <p className="text-xs text-muted-foreground">Tagline singkat yang akan muncul di bawah nama Anda.</p>
        {errors.headline && <p className="text-sm text-red-500 mt-1">{errors.headline.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">About Me / Biography</Label>
        <Textarea id="bio" {...register('bio')} rows={6} placeholder="Tell students more about yourself, your experience, and your teaching style." />
        {errors.bio && <p className="text-sm text-red-500 mt-1">{errors.bio.message}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="websiteUrl">Website or LinkedIn URL</Label>
        <Input id="websiteUrl" {...register('websiteUrl')} placeholder="https://..." />
        {errors.websiteUrl && <p className="text-sm text-red-500 mt-1">{errors.websiteUrl.message}</p>}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          Simpan Perubahan
        </Button>
      </div>
    </form>
  );
}