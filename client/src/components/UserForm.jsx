import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from './Spinner';
import Swal from 'sweetalert2';

// Zod schema
const userSchema = z.object({
  name:     z.string().min(1, 'Name is required'),
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password ≥6 chars').optional(),
  role:     z.enum(['ADMIN','TEACHER','STUDENT']),
  status:   z.enum(['ACTIVE','INACTIVE'])
});

export default function UserForm({ initial = {}, onSubmit, submitLabel }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name:   initial.name   || '',
      email:  initial.email  || '',
      role:   initial.role   || 'STUDENT',
      status: initial.status || 'ACTIVE'
    }
  });

  // 📌 This effect will re-populate the form whenever `initial` changes
  useEffect(() => {
    reset({
      name:   initial.name   || '',
      email:  initial.email  || '',
      role:   initial.role   || 'STUDENT',
      status: initial.status || 'ACTIVE'
    });
  }, [initial, reset]);

  const submitHandler = async data => {
    await onSubmit(data);
    reset(data);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 p-4 border rounded">
      {/* Name */}
      <div>
        <input
          {...register('name')}
          placeholder="Name"
          className={`w-full p-2 border rounded ${errors.name? 'border-red-500':'border-gray-300'}`}
        />
        {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
      </div>
      {/* Email */}
      <div>
        <input
          {...register('email')}
          placeholder="Email"
          className={`w-full p-2 border rounded ${errors.email? 'border-red-500':'border-gray-300'}`}
        />
        {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
      </div>
      {/* Password (only on create) */}
      {!initial.id && (
        <div>
          <input
            type="password"
            {...register('password')}
            placeholder="Password"
            className={`w-full p-2 border rounded ${errors.password? 'border-red-500':'border-gray-300'}`}
          />
          {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
        </div>
      )}
      {/* Role */}
      <div>
        <select {...register('role')} className="w-full p-2 border rounded">
          <option value="ADMIN">ADMIN</option>
          <option value="TEACHER">TEACHER</option>
          <option value="STUDENT">STUDENT</option>
        </select>
      </div>
      {/* Status */}
      <div>
        <select {...register('status')} className="w-full p-2 border rounded">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
      >
        {isSubmitting && <Spinner size={20} />}
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
