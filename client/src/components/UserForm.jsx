import { useForm } from 'react-hook-form';
import { createUserSchema, updateUserSchema } from '../schemas/userSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import Spinner from './Spinner';

// default values
const defaultCreateValues = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'STUDENT',
  status: 'ACTIVE',
};

export default function UserForm({
  initialData = null,
  onSubmit,
  onCancel,
  submitLabel = 'Submit User',
  hideFields = [],
  className,
}) {
  const isEditMode = initialData && initialData.id;
  const activeSchema = isEditMode ? updateUserSchema : createUserSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(activeSchema),
    defaultValues: isEditMode
      ? {
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          role: initialData.role || 'STUDENT',
          status: initialData.status || 'ACTIVE',
          password: '',
        }
      : defaultCreateValues,
  });

  const handleFormSubmit = async (data) => {
    const dataToSubmit = { ...data };

    if (isEditMode) {
      if (dataToSubmit.phone === '') {
        dataToSubmit.phone = null;
      }
      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }
    }

    await onSubmit(dataToSubmit);
  };

  // Helper untuk hide field
  const isHidden = (field) => hideFields.includes(field);

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Name */}
      {!isHidden('name') && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            id="name"
            type="text"
            {...register('name')}
            placeholder="Full Name"
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} shadow-sm sm:text-sm`}
          />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>
      )}

      {/* Email */}
      {!isHidden('email') && (
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="user@example.com"
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} shadow-sm sm:text-sm`}
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
        </div>
      )}

      {/* Phone */}
      {!isHidden('phone') && (
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            id="phone"
            type="tel"
            {...register('phone')}
            placeholder="phone"
            className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} shadow-sm sm:text-sm`}
          />
          {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
        </div>
      )}

      {/* Password */}
      {!isHidden('password') && (
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password {isEditMode ? '(Leave blank to keep current)' : ''}
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder={isEditMode ? "New Password" : "Min. 6 characters"}
            className={`w-full p-2 border rounded ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} shadow-sm sm:text-sm`}
          />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
        </div>
      )}

      {/* Role & Status (hanya jika tidak di-hide) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!isHidden('role') && (
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select 
              id="role"
              {...register('role')} 
              className={`w-full p-2 border rounded ${errors.role ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} shadow-sm sm:text-sm`}
            >
              <option value="STUDENT">STUDENT</option>
              <option value="TEACHER">TEACHER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="FINANCE">FINANCE</option>
            </select>
            {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>}
          </div>
        )}
        {!isHidden('status') && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              id="status"
              {...register('status')} 
              className={`w-full p-2 border rounded ${errors.status ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'} shadow-sm sm:text-sm`}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 mt-2 border-t">
        {onCancel && (
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
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 flex items-center justify-center"
        >
          {isSubmitting && <Spinner size={20} className="mr-2" />}
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
