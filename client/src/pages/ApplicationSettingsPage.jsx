// src/pages/admin/ApplicationSettingsPage.jsx (atau di mana pun file ini berada)
import React, { useEffect, useState, useCallback } from 'react';
import { getAppSettings, updateAppSettings } from '@/lib/api';
import Spinner from '@/components/Spinner';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Helper untuk membuat nama lebih ramah dibaca
const getFriendlyName = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

// --- Komponen Halaman Utama ---
export default function ApplicationSettingsPage() {
  const [settings, setSettings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Skema Zod untuk validasi form
  const settingsSchema = z.object({
    settings: z.array(z.object({
      key: z.string(),
      value: z.string().min(1, { message: "Value cannot be empty." }),
      description: z.string().optional()
    }))
  });
  
  // Inisialisasi React Hook Form
  const {
    register,
    handleSubmit,
    control, // Tidak dipakai
    reset,   // Untuk mengisi form dengan data
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    resolver: zodResolver(settingsSchema),
  });
  
  // Ambil data dari server
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAppSettings();
      const fetchedData = response.data || [];

      // Konversi nilai 'FEE' ke format persen untuk ditampilkan
      const mappedForDisplay = fetchedData.map(s => (
        s.key.includes('FEE_PERCENTAGE')
          ? { ...s, value: s.value !== null ? String(Number(s.value) * 100) : '' }
          : s
      ));
      
      setSettings(mappedForDisplay);
      // Set nilai default untuk react-hook-form setelah data diterima
      reset({ settings: mappedForDisplay });

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => { 
    fetchSettings(); 
  }, [fetchSettings]);

  // Fungsi untuk menyimpan perubahan
  const handleFormSubmit = async (data) => {
    try {
      // Konversi kembali nilai persen ke desimal sebelum dikirim
      const toSubmit = data.settings.map(s => (
        s.key.includes('FEE_PERCENTAGE')
          ? { ...s, value: (Number(s.value) / 100).toString() }
          : s
      ));

      await updateAppSettings(toSubmit);

      Swal.fire('Success!', 'Settings have been updated successfully.', 'success');
      setIsEditMode(false);
      fetchSettings();
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || 'Could not update settings.', 'error');
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="animate-fade-in max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Application Settings</CardTitle>
            </div>
            {!isEditMode && <Button onClick={() => setIsEditMode(true)}>Edit Settings</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {isEditMode ? (
            // --- TAMPILAN MODE EDIT (FORM) ---
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              {settings.map((setting, index) => (
                <div key={setting.key} className="space-y-2">
                  <Label htmlFor={`settings.${index}.value`} className="font-semibold">{getFriendlyName(setting.key)}</Label>
                  <p className="text-sm text-muted-foreground">{setting.description}</p>
                  <div className="relative">
                    <Input
                      id={`settings.${index}.value`}
                      {...register(`settings.${index}.value`)}
                      className={errors.settings?.[index]?.value ? 'border-red-500' : ''}
                      type="text"
                    />
                    {setting.key.includes('FEE_PERCENTAGE') && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>}
                  </div>
                  {errors.settings?.[index]?.value && <p className="text-xs text-red-500 mt-1">{errors.settings[index].value.message}</p>}
                </div>
              ))}
               <CardFooter className="flex justify-end gap-3 p-0 pt-6 mt-6 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsEditMode(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                  {isSubmitting && <Spinner size={20} className="mr-2" />}
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          ) : (
            // --- TAMPILAN MODE BACA (READ-ONLY) ---
            <dl className="space-y-6">
              {settings.map(setting => (
                <div key={setting.key} className="flex flex-col sm:flex-row">
                  <dt className="w-full sm:w-1/3 font-medium text-gray-800">{getFriendlyName(setting.key)}</dt>
                  <dd className="w-full sm:w-2/3 mt-1 sm:mt-0">
                    <p className="text-gray-900">
                      {setting.key.includes('FEE_PERCENTAGE') ? `${setting.value}%` : setting.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>
    </div>
  );
}