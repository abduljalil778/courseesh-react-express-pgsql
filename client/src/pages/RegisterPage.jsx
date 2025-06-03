// client/src/pages/RegisterPage.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api'; // Asumsi Anda punya api.js untuk axios instance
import { registerSchema } from '../schemas/registerSchema'; // Path ke skema Zod Anda
import Spinner from '../components/Spinner'; // Impor Spinner
import Swal from 'sweetalert2';

export default function RegisterPage() {

    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'STUDENT',
        },
    });

    const onSubmit = async (data) => {
    try {
      // Hapus confirmPassword karena tidak diperlukan oleh backend
      const { confirmPassword, ...payload } = data;
      await api.post('/auth/register', payload);
      Swal.fire({
        icon: 'success',
        title: 'Registration Successful!',
        text: 'You can now log in with your new account.',
        timer: 2000,
        showConfirmButton: false,
      });
      navigate('/login');
    } catch (err) {
      console.error("Registration error:", err);
      Swal.fire({
        icon: 'error',
        title: 'Registration Failed',
        text: err.response?.data?.message || 'An error occurred during registration.',
      });
    }
  };

  return (
    <>
    <div className="animate-fade-in min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-8 bg-white shadow-xl rounded-lg space-y-6 w-full max-w-md"
        >
        <h1 className="text-3xl font-bold text-center text-gray-800">Create Account</h1>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            id="name"
            type="text"
            {...register('name')}
            placeholder="Enter your full name"
            className={`w-full p-3 border rounded-md shadow-sm ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
          />
          {errors.name && (
            <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            placeholder="you@example.com"
            className={`w-full p-3 border rounded-md shadow-sm ${errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
          />
          {errors.email && (
            <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            placeholder="Min. 6 characters"
            className={`w-full p-3 border rounded-md shadow-sm ${errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
          />
          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            placeholder="Re-enter your password"
            className={`w-full p-3 border rounded-md shadow-sm ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>
        

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Spinner size={20} className="mr-2" /> Registering...
            </>
          ) : (
            'Register'
          )}
        </button>

        <div className="text-center text-sm">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
    </>
  )
}