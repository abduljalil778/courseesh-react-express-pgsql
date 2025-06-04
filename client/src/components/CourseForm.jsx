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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: initialData ? {
        ...initialData,
        numberOfSessions: initialData.numberOfSessions && ALLOWED_SESSIONS.includes(initialData.numberOfSessions) ? initialData.numberOfSessions : ALLOWED_SESSIONS[0],
        price: initialData.price !== undefined ? Number(initialData.price) : undefined,
        curriculum: initialData.curriculum || '',
    } : defaultValuesForCreate,
  });

  const watchedClassLevel = watch('classLevel');

  useEffect(() => {
    if (initialData && initialData.id) {
      reset({
        ...initialData,
        numberOfSessions: initialData.numberOfSessions && ALLOWED_SESSIONS.includes(initialData.numberOfSessions) ? initialData.numberOfSessions : ALLOWED_SESSIONS[0],
        price: initialData.price !== undefined ? Number(initialData.price) : undefined,
        curriculum: initialData.curriculum || '',
      });
    } else {
      reset(defaultValuesForCreate);
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
  };

  const getInputClassName = (fieldName) =>
    `w-full p-2 border rounded ${
      errors[fieldName] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
    } shadow-sm sm:text-sm bg-white`; // Tambahkan bg-white untuk select

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 mb-6 space-y-6 bg-white border rounded-lg shadow-md">
      {/* Title, Description, Price fields tetap sama */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Course Title
        </label>
        <input
          type="text"
          id="title"
          placeholder="e.g. Advanced Mathematics"
          {...register('title')}
          className={getInputClassName('title').replace('bg-white', '')} // Hapus bg-white jika tidak perlu untuk input teks
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          rows="3"
          placeholder="Detailed description of the course content..."
          {...register('description')}
          className={getInputClassName('description').replace('bg-white', '')} // Hapus bg-white jika tidak perlu untuk textarea
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            type="number"
            id="price"
            step="any" // Untuk harga desimal, sebelumnya kosong
            placeholder="Enter price"
            {...register('price', { valueAsNumber: true })}
            className={getInputClassName('price').replace('bg-white', '')} // Hapus bg-white jika tidak perlu
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        {/* Number of Sessions - Diubah menjadi Select */}
        <div>
          <label htmlFor="numberOfSessions" className="block text-sm font-medium text-gray-700 mb-1">
            Number of Sessions
          </label>
          <select
            id="numberOfSessions"
            {...register('numberOfSessions')}
            className={getInputClassName('numberOfSessions')} // Sudah termasuk bg-white
          >
            {ALLOWED_SESSIONS.map(sessionCount => (
              <option key={sessionCount} value={sessionCount}>
                {sessionCount} sessions
              </option>
            ))}
          </select>
          {errors.numberOfSessions && (
            <p className="mt-1 text-sm text-red-600">{errors.numberOfSessions.message}</p>
          )}
        </div>
      </div>

      {/* Class Level dan Curriculum fields tetap sama */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="classLevel" className="block text-sm font-medium text-gray-700 mb-1">
            Class Level
          </label>
          <select
            id="classLevel"
            {...register('classLevel')}
            className={getInputClassName('classLevel')}
          >
            {CLASS_LEVELS.map(level => ( //
              <option key={level} value={level}>{level.replace('GRADE_', 'Kelas ')}{level === 'UTBK' ? ' (UTBK)' : ''}</option>
            ))}
          </select>
          {errors.classLevel && (
            <p className="mt-1 text-sm text-red-600">{errors.classLevel.message}</p>
          )}
        </div>

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
              <option value="">Select Curriculum</option>
              {CURRICULA.map(curriculum => ( //
                <option key={curriculum} value={curriculum}>{curriculum === 'MERDEKA' ? 'Kurikulum Merdeka' : 'K13 Revisi'}</option>
              ))}
            </select>
            {errors.curriculum && (
              <p className="mt-1 text-sm text-red-600">{errors.curriculum.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Tombol Submit dan Cancel tetap sama */}
      <div className="flex items-center pt-4 mt-4 border-t border-gray-200 justify-end space-x-3">
        {onCancel && ( 
          <button
            type="button"
            onClick={onCancel} // Pastikan onCancel menutup modal atau mereset state di parent
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
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}