// src/pages/StudentBooking.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById, createBooking } from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { formatCurrencyIDR } from '../utils/formatCurrency';

export default function StudentBooking() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user: loggedInUser, loading: authLoading } = useAuth();

  const [course, setCourse] = useState(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(true);
  const [error, setError] = useState(null);

  const ALLOWED_INSTALLMENTS = [2, 3]; // Jumlah cicilan yang diizinkan

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    sessionDates: [],
    paymentMethod: 'FULL',
    installments: 2,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const loadCourseDetails = useCallback(async (id, currentUser) => {
    setIsLoadingCourse(true);
    setError(null);
    try {
      const response = await getCourseById(id);
      const courseData = response.data;
      setCourse(courseData);
      setForm(f => ({
        ...f,
        sessionDates: Array(courseData.numberOfSessions).fill(''),
        fullName: f.fullName || currentUser?.name || '',
        email: f.email || currentUser?.email || '',
        phone: f.phone || currentUser?.phone || '',
        address: f.address || currentUser?.address || '',
      }));
    } catch (err) {
      console.error('Failed to load course:', err);
      setError(err.response?.data?.message || 'Failed to load course details. Please try again.');
    } finally {
      setIsLoadingCourse(false);
    }
  }, []);

  useEffect(() => {
    if (courseId && !authLoading) {
      loadCourseDetails(courseId, loggedInUser);
    } else if (!courseId) {
      setError('No course ID provided.');
      setIsLoadingCourse(false);
    }
  }, [courseId, authLoading, loggedInUser, loadCourseDetails]);

  const handleChange = e => {
    const { name, value, type } = e.target;
    if (name.startsWith('session-')) {
      const idx = Number(name.split('-')[1]);
      setForm(f => {
        const updatedSessionDates = [...f.sessionDates];
        updatedSessionDates[idx] = value;
        return { ...f, sessionDates: updatedSessionDates };
      });
      return;
    }
    setForm(f => ({
      ...f,
      [name]: name === 'installments' && type === 'select-one'
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!form.fullName.trim() || !form.email.trim() || !form.address.trim()) {
        Swal.fire('Incomplete Data', 'Full Name, Email, and Address are required.', 'warning');
        setIsSubmitting(false);
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        Swal.fire('Invalid Email', 'Please enter a valid email address.', 'warning');
        setIsSubmitting(false);
        return;
    }
    if (form.phone.trim() && !/^\+?[0-9]{10,15}$/.test(form.phone.trim())) {
        Swal.fire('Invalid Phone', 'Please enter a valid phone number (10-15 digits, e.g., 08xxxxxxxxxx or +62xxxx).', 'warning');
        setIsSubmitting(false);
        return;
    }
    if (form.sessionDates.some(date => !date)) {
        Swal.fire('Incomplete Data', 'Please pick all session dates.', 'warning');
        setIsSubmitting(false);
        return;
    }
    try {
      const bookingPayload = {
        courseId,
        studentFullName: form.fullName,
        studentEmail: form.email,
        studentPhone: form.phone,
        address: form.address,
        sessionDates: form.sessionDates,
        paymentMethod: form.paymentMethod,
        ...(form.paymentMethod === 'INSTALLMENT'
          ? { installments: form.installments }
          : {}),
      };
      await createBooking(bookingPayload);
      Swal.fire({
        icon: 'success',
        title: 'Booking Confirmed!',
        text: 'Your course booking has been successfully submitted. You will be redirected shortly.',
        timer: 3000,
        showConfirmButton: false,
        willClose: () => {
          navigate('/student/');
        }
      });
    } catch (err) {
      console.error('Booking failed:', err);
      const errMsg = err.response?.data?.message || 'Booking failed. Please check your input and try again.';
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || (isLoadingCourse && !course)) { // Kondisi loading gabungan
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button
          onClick={() => courseId && !authLoading ? loadCourseDetails(courseId, loggedInUser) : navigate('/student/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
        >
          Retry
        </button>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!course && !isLoadingCourse && !authLoading) { // Setelah semua loading selesai dan course tetap null
    return (
      <div className="p-6 text-center text-xl text-gray-600">
        Course details could not be loaded or the course does not exist.
        <button
          onClick={() => navigate('/student/dashboard')}
          className="block mx-auto mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Jika lolos dari semua kondisi di atas, return utama untuk form akan dieksekusi.
  // Pastikan `course` tidak null sebelum mengakses propertinya di JSX di bawah ini.
  // Kondisi `if (!course && !isLoadingCourse && !authLoading)` di atas sudah menangani ini.
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        {/* Judul dengan null check untuk course */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
          Book Course: {course ? course.title : 'Loading course title...'}
        </h1>
        
        {/* Informasi Kursus dengan null check */}
        {course && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-md space-y-1 text-sm text-indigo-700">
              <p className="truncate"><strong>Description:</strong> {course.description}</p>
              <p><strong>Price:</strong> <span className="font-semibold text-lg">{formatCurrencyIDR(course.price)}</span></p>
              <p><strong>Sessions:</strong> {course.numberOfSessions} | <strong>Class:</strong> {course.classLevel.replace('GRADE_', 'Kelas ')}</p>
              {course.classLevel !== 'UTBK' && (
                  <p><strong>Curriculum:</strong> {course.curriculum}</p>
              )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... (sisa field form: fullName, email, phone, address, sessionDates, paymentMethod, installments) ... */}
          {/* Pastikan semua field ini sudah ada di sini seperti pada kode sebelumnya */}
           <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Your Details</h2>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="youremail@example.com"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="Enter your phone number"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Full Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Enter your full address for certificate shipping, if any"
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2 pt-2">Session & Payment</h2>
          {course && form.sessionDates && ( // Pastikan course dan sessionDates ada sebelum map
            <div>
                <h3 className="text-md font-medium text-gray-700 mb-1">
                Pick {course.numberOfSessions} Session Date{course.numberOfSessions > 1 && 's'} <span className="text-red-500">*</span>
                </h3>
                <div className="space-y-3">
                {form.sessionDates.map((dateValue, i) => (
                    <div key={i}>
                    <label htmlFor={`session-${i}`} className="block text-xs font-medium text-gray-600 mb-0.5">
                        Session {i + 1}
                    </label>
                    <input
                        type="date"
                        id={`session-${i}`}
                        name={`session-${i}`}
                        value={dateValue}
                        onChange={handleChange}
                        required
                        min={today}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    </div>
                ))}
                </div>
            </div>
          )}


          <div>
            <h3 className="text-md font-medium text-gray-700 mb-2">Payment Method <span className="text-red-500">*</span></h3>
            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-md hover:border-indigo-500 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="FULL"
                  checked={form.paymentMethod === 'FULL'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-3"
                />
                <span className="text-sm font-medium text-gray-700">Full Payment</span>
              </label>
              <label className="flex items-center p-3 border rounded-md hover:border-indigo-500 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="INSTALLMENT"
                  checked={form.paymentMethod === 'INSTALLMENT'}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mr-3"
                />
                <span className="text-sm font-medium text-gray-700">Installments</span>
              </label>
            </div>
          </div>
          
          {form.paymentMethod === 'INSTALLMENT' && (  
            <div>
              <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Installments <span className="text-red-500">*</span>
              </label>
              <select
                id="installments"
                name="installments"
                value={form.installments}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white sm:text-sm"
                required
              >
                {ALLOWED_INSTALLMENTS.map(n => (
                  <option key={n} value={n}>{n} installments</option>
                ))}
              </select>
              {/* Mungkin perlu update Zod schema jika ada di frontend untuk validasi awal */}
            </div>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isLoadingCourse || authLoading || !course} // Tambahkan !course
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-semibold text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <Spinner size={20} className="mr-2"/> Processing...
              </>
            ) : (
              'Confirm & Proceed to Payment'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}