// src/components/profile/ProfileForm.jsx
import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUser } from '@/lib/api';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Spinner from '@/components/Spinner';
import { X, PlusCircle } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  headline: z.string().max(100).optional(),
  bio: z.string().max(1000).optional(),
  websiteUrl: z.string().url('Please enter a valid URL').or(z.literal('')).optional(),
  certifications: z.array(z.string()).optional(),
  education: z.array(z.string()).optional(),
});

export default function ProfileForm({ user, onUpdate, onCancel }) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      phone: user.phone || '',
      headline: user.headline || '',
      bio: user.bio || '',
      websiteUrl: user.websiteUrl || '',
      certifications: user.certifications && user.certifications.length > 0 ? user.certifications : [''],
      education: user.education && user.education.length > 0 ? user.education : [''],
    },
  });

  const { fields: certFields, append: appendCert, remove: removeCert } = useFieldArray({ control, name: "certifications" });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });

  const handleUpdateProfile = async (data) => {
    try {
      const response = await updateUser(user.id, data);
      Swal.fire("Success!", "Profile data has been updated.", "success");
      onUpdate(response.data.data);
    } catch (err) {
      Swal.fire("Error!", err.response?.data?.message || "Could not update profile.", "error");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-8 max-w-2xl">
      {/* --- Informasi Pribadi --- */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Informasi Pribadi</h3>
        <div className="space-y-2">
          <Label htmlFor="name">Nama Lengkap</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <Input id="phone" {...register('phone')} />
        </div>
      </div>
      
      {/* --- Informasi Publik (Hanya untuk Guru) --- */}
      {user.role === 'TEACHER' && (
        <div className="space-y-4 pt-6 border-t">
          <h3 className="font-semibold text-gray-800">Profil Publik</h3>
          <p className="text-sm text-muted-foreground">Informasi ini akan ditampilkan di halaman profil publik Anda.</p>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" {...register('headline')} placeholder="e.g., Guru Matematika & Juara Olimpiade" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / Tentang Saya</Label>
            <Textarea id="bio" {...register('bio')} rows={5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">URL Website/LinkedIn</Label>
            <Input id="websiteUrl" {...register('websiteUrl')} type="url" placeholder="https://..." />
            {errors.websiteUrl && <p className="text-sm text-red-500">{errors.websiteUrl.message}</p>}
          </div>

          {/* Input Dinamis untuk Sertifikasi */}
          <div className="space-y-2">
            <Label>Sertifikasi</Label>
            {certFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input {...register(`certifications.${index}`)} placeholder={`Sertifikasi #${index + 1}`} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeCert(index)}><X className="h-4 w-4 text-red-500"/></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendCert("")}><PlusCircle className="h-4 w-4 mr-2"/>Tambah Sertifikasi</Button>
          </div>

          {/* Input Dinamis untuk Pendidikan */}
          <div className="space-y-2">
            <Label>Pendidikan</Label>
            {eduFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input {...register(`education.${index}`)} placeholder={`Pendidikan #${index + 1}`} />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeEdu(index)}><X className="h-4 w-4 text-red-500"/></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendEdu("")}><PlusCircle className="h-4 w-4 mr-2"/>Tambah Riwayat Pendidikan</Button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? <Spinner size={20} className="mr-2" /> : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}