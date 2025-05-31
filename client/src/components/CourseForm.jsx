// src/components/CourseForm.jsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CLASS_LEVELS, CURRICULA } from '../config';

// Definisikan skema Zod di luar komponen agar tidak dibuat ulang pada setiap render
const courseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .or(z.literal(0).transform(() => 0)), // Izinkan 0 atau angka positif
  numberOfSessions: z
    .number({ invalid_type_error: 'Number of sessions is required' })
    .int('Number of sessions must be an integer')
    .min(1, 'At least 1 session is required'),
  classLevel: z.enum(CLASS_LEVELS, {
    errorMap: () => ({ message: 'Please select a valid class level' }),
  }),
  curriculum: z.enum(CURRICULA).optional().or(z.literal('')), // Izinkan string kosong jika opsional
});

// Nilai default untuk form saat membuat course baru
const defaultValuesForCreate = {
  title: '',
  description: '',
  price: undefined, // Biarkan placeholder muncul, atau set 0 jika lebih disukai
  numberOfSessions: 1,
  classLevel: CLASS_LEVELS[0] || '', // Default ke level pertama atau string kosong
  curriculum: '', // Default ke string kosong untuk 'Select curriculum'
};

export default function CourseForm({
  initialData = null, // Ubah nama prop agar konsisten dan beri nilai default null
  onSubmit,
  onCancel, // Tambahkan prop onCancel
  submitLabel = 'Submit',
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    control, // Untuk komponen kontrol jika diperlukan nanti
  } = useForm({
    resolver: zodResolver(courseSchema),
    // Default values akan di-override oleh useEffect jika initialData berubah
    defaultValues: initialData ? {
        ...initialData,
        numberOfSessions: initialData.numberOfSessions || 1,
        price: initialData.price !== undefined ? Number(initialData.price) : undefined,
        curriculum: initialData.curriculum || '',
    } : defaultValuesForCreate,
  });

  // Mengawasi perubahan classLevel untuk menampilkan/menyembunyikan kurikulum
  const watchedClassLevel = watch('classLevel');

  // Effect untuk mereset form ketika initialData berubah (misalnya saat beralih mode edit/create)
  useEffect(() => {
    if (initialData && initialData.id) {
      // Mode Edit: isi form dengan initialData
      reset({
        ...initialData,
        numberOfSessions: initialData.numberOfSessions || 1,
        price: initialData.price !== undefined ? Number(initialData.price) : undefined,
        curriculum: initialData.curriculum || '', // Pastikan ada nilai default jika undefined
      });
    } else {
      // Mode Create atau setelah cancel: reset ke nilai default untuk pembuatan
      reset(defaultValuesForCreate);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data) => {
    // Tidak perlu reset(data) di sini, biarkan parent (TeacherDashboard)
    // yang mengontrol state form melalui prop initialData setelah submit.
    // Parent akan memuat ulang data atau membersihkan editingCourse,
    // yang akan memicu useEffect di atas untuk mereset form jika perlu.
    await onSubmit(data);
  };

  // Fungsi untuk styling input dengan error
  const getInputClassName = (fieldName) =>
    `w-full p-2 border rounded ${
      errors[fieldName] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    } shadow-sm sm:text-sm`;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 mb-6 space-y-6 bg-white border rounded-lg shadow-md">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Course Title
        </label>
        <input
          type="text"
          id="title"
          placeholder="e.g. Advanced Mathematics"
          {...register('title')}
          className={getInputClassName('title')}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows="3"
          placeholder="Detailed description of the course content..."
          {...register('description')}
          className={getInputClassName('description')}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            id="price"
            step="" // Untuk harga desimal
            placeholder="price"
            {...register('price', { valueAsNumber: true })}
            className={getInputClassName('price')}
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        {/* Number of Sessions */}
        <div>
          <label htmlFor="numberOfSessions" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Sessions
          </label>
          <input
            type="number"
            id="numberOfSessions"
            min="1"
            placeholder="e.g. 10"
            {...register('numberOfSessions', { valueAsNumber: true })}
            className={getInputClassName('numberOfSessions')}
          />
          {errors.numberOfSessions && (
            <p className="mt-1 text-sm text-red-600">{errors.numberOfSessions.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Class Level */}
        <div>
          <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Class Level
          </label>
          <select
            id="classLevel"
            {...register('classLevel')}
            className={getInputClassName('classLevel')}
          >
            {/* <option value="">Select Class Level</option> */}
            {CLASS_LEVELS.map(level => (
              <option key={level} value={level}>{level}</option>
            ))}
          </select>
          {errors.classLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.classLevel.message}</p>
          )}
        </div>

        {/* Curriculum (conditional) */}
        {watchedClassLevel !== 'UTBK' && (
          <div>
            <label htmlFor="curriculum" className="block text-sm font-medium text-gray-700 mb-1">
              Curriculum
            </label>
            <select
              id="curriculum"
              {...register('curriculum')}
              className={getInputClassName('curriculum')}
            >
              <option value="">Select Curriculum (Optional)</option>
              {CURRICULA.map(curriculum => (
                <option key={curriculum} value={curriculum}>{curriculum}</option>
              ))}
            </select>
            {errors.curriculum && (
              <p className="mt-1 text-sm text-red-600">{errors.curriculum.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="flex items-center pt-4 mt-4 border-t border-gray-200 justify-end space-x-3">
        {onCancel && initialData && initialData.id && ( // Tampilkan tombol Cancel hanya jika prop onCancel ada & mode edit
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}