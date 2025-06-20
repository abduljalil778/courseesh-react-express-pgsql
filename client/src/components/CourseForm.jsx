// src/components/CourseForm.jsx
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CLASS_LEVELS, CURRICULA, SUBJECT_CATEGORIES } from '../config';
import Spinner from './Spinner';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, PlusCircle } from 'lucide-react';

const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.preprocess((val) => Number(val), z.number().min(0, 'Price must be non-negative')),
  classLevels: z.array(z.string()).min(1, { message: 'At least one class level is required.' }),
  curriculum: z.string().optional().default(''),
  category: z.string().min(1, 'Category is required'),
  learningObjectives: z.array(z.string()).optional(),
});

export default function CourseForm({
  initialData = null,
  onSuccess,
  onCancel,
  onSubmit,
  submitLabel = 'Save',
}) {
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.imageUrl || null);
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control, // <-- Ambil 'control' dari useForm
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '', description: '', price: 0,
      classLevels: [], curriculum: '', category: 'UMUM',
      learningObjectives: [''], // <-- Inisialisasi dengan satu input kosong
      ...initialData,
    },
  });

  // --- 3. Gunakan useFieldArray untuk mengelola input dinamis ---
  const { fields, append, remove } = useFieldArray({
    control,
    name: "learningObjectives"
  });

  useEffect(() => {
    if (initialData) {
      // Pastikan learningObjectives di-reset dengan benar
      const objectives = initialData.learningObjectives && initialData.learningObjectives.length > 0 
        ? initialData.learningObjectives 
        : [''];
      reset({ category: 'UMUM', ...initialData, learningObjectives: objectives });
      setPreviewUrl(initialData.imageUrl || null);
      setThumbnailFile(null);
    }
  }, [initialData, reset]);

  const watchedClassLevels = watch('classLevels', []);
  useEffect(() => {
    if (watchedClassLevels.includes('UTBK') && watchedClassLevels.length === 1) {
      setValue('curriculum', '');
    }
  }, [watchedClassLevels, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = async (data) => {
    const formData = new FormData();
    
    // Pisahkan learningObjectives dari data lain
    const { learningObjectives, ...restOfData } = data;

    Object.entries(restOfData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        formData.append(key, value.join(','));
      } else {
        formData.append(key, value ?? '');
      }
    });

    // Kirim array sebagai string JSON. Ini cara paling aman untuk FormData.
    const validObjectives = learningObjectives.filter(obj => obj && obj.trim() !== '');
    formData.append('learningObjectives', JSON.stringify(validObjectives));

    if (thumbnailFile) {
      formData.append('thumbnailFile', thumbnailFile);
    }

    Swal.fire({ title: isEditMode ? 'Updating Course...' : 'Creating Course...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      if (onSubmit) {
        await onSubmit(formData, isEditMode, initialData?.id);
      }
      await Swal.fire('Success!', `Course ${isEditMode ? 'updated' : 'created'} successfully.`, 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || 'Operation failed.', 'error');
    }
  };

  const handleCancel = () => {
    reset(initialData || {
      title: '', description: '', price: 0,
      classLevels: [], curriculum: '', category: 'UMUM'
    });
    setThumbnailFile(null);
    setPreviewUrl(initialData?.imageUrl || null);
    if (onCancel) onCancel();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Course Title *</Label>
        <Input id="title" {...register('title')} />
        {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" {...register('description')} />
        {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>}
      </div>
      {/* --- 5. Implementasikan UI Input Dinamis --- */}
      <div className="space-y-2 pt-4 border-t">
        <Label className="font-semibold">Apa yang Akan Dipelajari</Label>
        <p className="text-xs text-muted-foreground">Tambahkan poin-poin utama yang akan didapat siswa dari kursus ini.</p>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <Input
              placeholder={`Poin pembelajaran #${index + 1}`}
              {...register(`learningObjectives.${index}`)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              disabled={fields.length <= 1}
              className="shrink-0"
            >
              <X className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append("")}
          className="mt-2"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Tambah Poin
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price/Session *</Label>
          <Input id="price" type="number" step="any" {...register('price')} />
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>}
        </div>
        
      </div>
      <div>
        <Label className="mb-2 block">Class Levels *</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CLASS_LEVELS.map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <input
                type="checkbox"
                id={`classLevels-${level}`}
                value={level}
                {...register('classLevels')}
                className="h-4 w-4"
              />
              <Label htmlFor={`classLevels-${level}`} className="font-normal">{level}</Label>
            </div>
          ))}
        </div>
        {errors.classLevels && <p className="text-sm text-red-500 mt-1">{errors.classLevels.message}</p>}
      </div>
      <div>
        <Label htmlFor="curriculum">Curriculum</Label>
        <select
          id="curriculum"
          {...register('curriculum')}
          disabled={watchedClassLevels.includes('UTBK') && watchedClassLevels.length === 1}
          className="w-full h-10 border border-input bg-background px-3 py-2 text-sm rounded-md"
        >
          <option value="">Select Curriculum</option>
          {CURRICULA.map(curr => (<option key={curr.value} value={curr.value}>{curr.label}</option>))}
        </select>
        {errors.curriculum && <p className="text-sm text-red-500 mt-1">{errors.curriculum.message}</p>}
      </div>
      <div>
        <Label htmlFor="category">Category *</Label>
        <select
          id="category"
          {...register('category')}
          className="w-full h-10 border border-input bg-background px-3 py-2 text-sm rounded-md"
        >
          {SUBJECT_CATEGORIES.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>}
      </div>
      <div>
        <Label htmlFor="thumbnailFile">Course Thumbnail</Label>
        <Input
          id="thumbnailFile"
          name="thumbnailFile"
          type="file"
          onChange={handleFileChange}
          accept="image/*"
          className="mt-1"
        />
        {previewUrl && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Image Preview:</p>
            <img
              src={previewUrl.startsWith('blob:') ? previewUrl : `${import.meta.env.VITE_API_URL.replace('/api', '')}${previewUrl}`}
              alt="Thumbnail preview"
              className="h-24 w-auto rounded-md mt-1 border p-1"
            />
          </div>
        )}
      </div>
      <div className="flex items-center justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
