// src/components/CourseForm.jsx
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CLASS_LEVELS, CURRICULA } from '../config';
import {courseSchema, defaultValuesForCreate, ALLOWED_SESSIONS} from '../schemas/courseSchema';
import Spinner from './Spinner';


export default function CourseForm({
  initialData = null,
  onSubmit,
  onCancel,
  submitLabel = 'Submit',
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control, // Ambil control dari useForm
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData ? {
        ...initialData,
        numberOfSessions: initialData.numberOfSessions && ALLOWED_SESSIONS.includes(initialData.numberOfSessions) 
                          ? initialData.numberOfSessions 
                          : ALLOWED_SESSIONS[0],
        price: initialData.price !== undefined ? Number(initialData.price) : undefined,
        classLevels: Array.isArray(initialData.classLevels) ? initialData.classLevels : [], // Pastikan array
        curriculum: initialData.curriculum || '',
    } : defaultValuesForCreate,
  });

  const watchedClassLevels = watch('classLevels', []); // Awasi classLevels, default ke array kosong

  useEffect(() => {
    const defaultVals = initialData ? {
        ...initialData,
        price: initialData.price !== undefined ? Number(initialData.price) : undefined,
        classLevels: Array.isArray(initialData.classLevels) ? initialData.classLevels : [],
        curriculum: initialData.curriculum || '',
        numberOfSessions: initialData.numberOfSessions && ALLOWED_SESSIONS.includes(initialData.numberOfSessions) 
                          ? initialData.numberOfSessions 
                          : ALLOWED_SESSIONS[0],
    } : defaultValuesForCreate;
    reset(defaultVals);
  }, [initialData, reset]);

  // Menyesuaikan curriculum jika UTBK dipilih/dihilangkan
  useEffect(() => {
    const isUtbkSelected = watchedClassLevels.includes('UTBK');
    const hasOtherLevels = watchedClassLevels.some(level => level !== 'UTBK');

    if (isUtbkSelected && !hasOtherLevels) { // Jika HANYA UTBK yang dipilih
      setValue('curriculum', ''); // Kosongkan curriculum
    }
    // Jika UTBK dihilangkan dan hanya ada level lain, user bisa pilih curriculum
    // Jika semua classLevels dihilangkan, curriculum juga bisa dikosongkan
  }, [watchedClassLevels, setValue]);


  const handleFormSubmit = async (data) => {
    const dataToSubmit = {
        ...data,
        price: Number(data.price),
        numberOfSessions: Number(data.numberOfSessions),
        // Jika hanya UTBK yang dipilih, atau tidak ada SD/SMP/SMA, curriculum bisa null/kosong
        curriculum: data.classLevels.includes('UTBK') && !data.classLevels.some(l => ['SD','SMP','SMA'].includes(l)) 
                    ? null 
                    : data.curriculum || null,
    };
    await onSubmit(dataToSubmit);
  };

  const getInputClassName = (fieldName, isCheckbox = false) =>
    isCheckbox 
    ? `h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 ${errors[fieldName] ? 'border-red-500' : ''}`
    : `w-full p-2 border rounded ${
        errors[fieldName] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
      } shadow-sm sm:text-sm bg-white`;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 mb-6 space-y-6 bg-white border rounded-lg shadow-md">
      {/* Title, Description, Price, numberOfSessions tetap sama (dengan select untuk numberOfSessions) */}
      {/* ... (field title, description, price, numberOfSessions seperti sebelumnya) ... */}
       <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Course Title</label>
        <input type="text" id="title" {...register('title')} className={getInputClassName('title').replace('bg-white', '')} />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea id="description" rows="3" {...register('description')} className={getInputClassName('description').replace('bg-white', '')} />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input type="number" id="price" step="any" {...register('price', { valueAsNumber: true })} className={getInputClassName('price').replace('bg-white', '')} />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label htmlFor="numberOfSessions" className="block text-sm font-medium text-gray-700 mb-1">Number of Sessions</label>
          <select id="numberOfSessions" {...register('numberOfSessions')} className={getInputClassName('numberOfSessions')}>
            {ALLOWED_SESSIONS.map(sessionCount => (<option key={sessionCount} value={sessionCount}>{sessionCount} sessions</option>))}
          </select>
          {errors.numberOfSessions && <p className="mt-1 text-sm text-red-600">{errors.numberOfSessions.message}</p>}
        </div>
      </div>

      {/* Class Levels - Diubah menjadi Checkbox Group */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Class Levels <span className="text-red-500">*</span> (Select one or more)
        </label>
        <div className="space-y-2">
          {CLASS_LEVELS.map((level) => (
            <label key={level} htmlFor={`classLevels-${level}`} className="flex items-center">
              <input
                type="checkbox"
                id={`classLevels-${level}`}
                value={level}
                {...register('classLevels')} // react-hook-form akan menangani array value
                className={getInputClassName('classLevels', true) + " mr-2"}
              />
              <span className="text-sm text-gray-700">{level}</span>
            </label>
          ))}
        </div>
        {errors.classLevels && (
          <p className="mt-1 text-sm text-red-600">{errors.classLevels.message}</p>
        )}
      </div>

      {/* Curriculum (conditional, hanya tampil jika bukan HANYA UTBK yang dipilih) */}
      {watchedClassLevels && !watchedClassLevels.includes('UTBK') || watchedClassLevels.some(l => l !== 'UTBK') && watchedClassLevels.length > 1 ? (
         // Tampilkan jika (tidak ada UTBK) ATAU (ada UTBK TAPI ada level lain juga)
        <div>
          <label htmlFor="curriculum" className="block text-sm font-medium text-gray-700 mb-1">
            Curriculum (for SD/SMP/SMA)
          </label>
          <select
            id="curriculum"
            {...register('curriculum')}
            className={getInputClassName('curriculum')}
            disabled={watchedClassLevels.includes('UTBK') && watchedClassLevels.length === 1} // Disable jika HANYA UTBK dipilih
          >
            <option value="">Select Curriculum (Optional for SD/SMP/SMA)</option>
            {CURRICULA.map(curriculum => (
              <option key={curriculum} value={curriculum}>{curriculum === 'MERDEKA' ? 'Kurikulum Merdeka' : 'K13 Revisi'}</option>
            ))}
          </select>
          {errors.curriculum && (
            <p className="mt-1 text-sm text-red-600">{errors.curriculum.message}</p>
          )}
        </div>
      ) : null}

      {/* Tombol Submit dan Cancel */}
      <div className="flex items-center pt-4 mt-4 border-t border-gray-200 justify-end space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancel
          </button>
        )}
        <button type="submit" disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60">
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}