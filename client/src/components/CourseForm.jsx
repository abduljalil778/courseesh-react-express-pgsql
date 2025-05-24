import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const courseSchema = z.object({
  title:       z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  price:       z.number().positive('> 0'),
});

export default function CourseForm({ initial = {}, onSubmit, submitLabel }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm({
      resolver: zodResolver(courseSchema),
      defaultValues: initial
    });

  // only reset when a real course (with an id) is passed in
  useEffect(() => {
    if (initial.id) {
      reset({
        title:       initial.title,
        description: initial.description,
        price:       initial.price
      });
    }
  }, [initial.id, reset]);

  const submitHandler = async data => {
    await onSubmit(data);
    reset(data);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      {/* Title */}
      <div>
        <input
          type="text"
          placeholder="Course Title"
          {...register('title')}
          className={`w-full p-2 border rounded ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && (
          <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <textarea
          placeholder="Description"
          {...register('description')}
          className={`w-full p-2 border rounded ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.description && (
          <p className="text-red-600 text-sm mt-1">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Price */}
      <div>
        <input
          type="number"
          step="0.01"
          placeholder="Price"
          {...register('price', { valueAsNumber: true })}
          className={`w-full p-2 border rounded ${
            errors.price ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.price && (
          <p className="text-red-600 text-sm mt-1">{errors.price.message}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
