// src/pages/StudentBooking.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

  const ALLOWED_INSTALLMENTS = [2, 3];

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

  const loadCourseDetails = useCallback(async (id, currentUser) => {
    setIsLoadingCourse(true);
    setError(null);
    try {
      const response = await getCourseById(id);
      const courseData = response.data;
      setCourse(courseData);
      setForm(f => ({
        ...f,
        sessionDates: Array(courseData.numberOfSessions || 0).fill(''),
        fullName: f.fullName || currentUser?.name || '',
        email: f.email || currentUser?.email || '',
        phone: f.phone || currentUser?.phone || '',
        address: f.address || '',
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course details.');
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
    const { name, value } = e.target;
    if (name === "paymentMethod") {
      setForm(f => ({ ...f, paymentMethod: value }));
      return;
    }
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
      [name]: name === 'installments' ? Number(value) : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Validasi sederhana sebelum submit
    if (form.sessionDates.some(date => !date)) {
        Swal.fire('Incomplete Data', 'Please pick all session dates.', 'warning');
        return;
    }
    
    setIsSubmitting(true);
    try {
      const bookingPayload = {
        courseId,
        studentFullName: form.fullName,
        studentEmail: form.email,
        studentPhone: form.phone,
        address: form.address,
        sessionDates: form.sessionDates,
        paymentMethod: form.paymentMethod,
        ...(form.paymentMethod === 'INSTALLMENT' ? { installments: form.installments } : {}),
      };
      
      // PERBAIKAN: Simpan hasil pemanggilan API ke variabel 'response'
      const response = await createBooking(bookingPayload);
      const newBookingId = response.data.id; // Ambil ID dari respons

      Swal.fire({
        icon: 'success',
        title: 'Booking Confirmed!',
        text: 'You will now be redirected to the payment page.',
        timer: 2500,
        showConfirmButton: false,
        willClose: () => {
          // Arahkan ke halaman instruksi pembayaran yang benar
          navigate(`/student/bookings/${newBookingId}/pay`); 
        }
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: err.response?.data?.message || 'Failed to create booking.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentDetails = useMemo(() => {
    if (!course) return { total: 0, firstPayment: 0 };
    const total = course.price;
    let firstPayment = total;
    if (form.paymentMethod === 'INSTALLMENT') {
      firstPayment = total / form.installments;
    }
    return {
      total,
      firstPayment: Math.round(firstPayment)
    };
  }, [course, form.paymentMethod, form.installments]);

  if (authLoading || isLoadingCourse) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size={60} /></div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-500">{error}</div>;
  }
  if (!course) {
    return <div className="p-6 text-center text-gray-500">Course not found.</div>;
  }

  return (
    <div className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <button onClick={() => navigate(-1)} className="mb-6 text-sm text-indigo-600 hover:underline">
          &larr; Back to Course Details
        </button>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          
          {/* Sisi Kiri: Form Isian */}
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Booking Checkout</h1>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">1. Contact Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input type="text" id="fullName" name="fullName" value={form.fullName} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                  <input type="email" id="email" name="email" value={form.email} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address *</label>
                  <textarea id="address" name="address" value={form.address} onChange={handleChange} required rows="3" className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">2. Schedule Your {course.numberOfSessions} Sessions *</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.sessionDates.map((dateValue, i) => (
                    <div key={i}>
                      <label htmlFor={`session-${i}`} className="block text-xs font-medium text-gray-600">Session {i + 1}</label>
                      <input type="datetime-local" id={`session-${i}`} name={`session-${i}`} value={dateValue} onChange={handleChange} required min={new Date().toISOString().slice(0, 16)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-3">3. Payment Method</h2>
              <div className="space-y-4">
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${form.paymentMethod === 'FULL' ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="FULL" checked={form.paymentMethod === 'FULL'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="ml-3 font-medium text-gray-800">Full Payment</span>
                </label>
                <label className={`flex items-center p-4 border rounded-lg cursor-pointer ${form.paymentMethod === 'INSTALLMENT' ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-300'}`}>
                  <input type="radio" name="paymentMethod" value="INSTALLMENT" checked={form.paymentMethod === 'INSTALLMENT'} onChange={handleChange} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                  <span className="ml-3 font-medium text-gray-800">Installments</span>
                </label>
              </div>
              {form.paymentMethod === 'INSTALLMENT' && (
                <div className="mt-4 pl-8">
                  <label htmlFor="installments" className="block text-sm font-medium text-gray-700">Number of Installments</label>
                  <select id="installments" name="installments" value={form.installments} onChange={handleChange} required className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm bg-white">
                    {ALLOWED_INSTALLMENTS.map(n => (<option key={n} value={n}>{n} times</option>))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan: Ringkasan Pesanan */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-800 border-b pb-4 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Course Title:</span>
                  <span className="font-medium text-right">{course.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrencyIDR(course.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">{form.paymentMethod === 'INSTALLMENT' ? `${form.installments}x Installments` : 'Full Payment'}</span>
                </div>
              </div>
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-800">
                    {form.paymentMethod === 'FULL' ? 'Total Payment:' : 'First Payment Due:'}
                  </span>
                  <span className="text-indigo-600">
                    {formatCurrencyIDR(paymentDetails.firstPayment)}
                  </span>
                </div>
                {form.paymentMethod === 'INSTALLMENT' && (
                  <p className="text-xs text-gray-500 text-right">
                    (Total Course Price: {formatCurrencyIDR(paymentDetails.total)})
                  </p>
                )}
              </div>
              <button type="submit" disabled={isSubmitting || isLoadingCourse || authLoading} className="mt-6 w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-semibold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-70 flex items-center justify-center">
                {isSubmitting ? <><Spinner size={20} className="mr-2"/> Processing...</> : 'Confirm & Proceed'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}