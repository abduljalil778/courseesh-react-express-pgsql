import React from 'react';
import { useForm } from 'react-hook-form';
import Spinner from '../Spinner';

export default function CategoryForm({ initialData = null, onSubmit, onCancel, isSubmitting }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      isActive: initialData?.isActive === false ? false : true,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Kategori *</label>
        <input type="text" id="name" {...register('name', { required: 'Nama kategori wajib diisi' })} className="mt-1 w-full p-2 border rounded-md" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi (Opsional)</label>
        <textarea id="description" {...register('description')} rows="3" className="mt-1 w-full p-2 border rounded-md" />
      </div>
      <div className="flex items-center">
        <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4 rounded" />
        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Aktif</label>
      </div>
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 rounded-md">Batal</button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center">
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          {initialData ? 'Perbarui Kategori' : 'Buat Kategori'}
        </button>
      </div>
    </form>
  );
}