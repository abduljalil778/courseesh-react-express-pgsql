// src/pages/admin/BookingManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { getAllBookings } from '../../lib/api';
import Spinner from '../../components/Spinner';

export default function BookingManagementPage() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings(); // Ini akan mengambil semua booking
      setBookings(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallPaymentStatusForBooking = (booking) => {
    if (!booking.payments || booking.payments.length === 0) {
      return { text: 'NO PAYMENTS', colorClass: 'bg-gray-100 text-gray-800' };
    }
    if (booking.payments.every(p => p.status === 'PAID')) {
      return { text: 'FULLY PAID', colorClass: 'bg-green-100 text-green-800' };
    }
    if (booking.payments.some(p => p.status === 'PAID')) {
      return { text: 'PARTIALLY PAID', colorClass: 'bg-yellow-100 text-yellow-800' };
    }
    if (booking.payments.some(p => p.status === 'FAILED')) {
      return { text: 'HAS FAILED', colorClass: 'bg-red-100 text-red-800' };
    }
    return { text: 'PENDING', colorClass: 'bg-orange-100 text-orange-800' };
  };


  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Booking Management</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {bookings.length > 0 ? bookings.map(booking => {
                    const paymentStatus = getOverallPaymentStatusForBooking(booking);
                    return (
                        <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{booking.course?.title}</div>
                                <div className="text-sm text-gray-500 font-mono">{booking.id}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{booking.student?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{booking.course?.teacher?.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(booking.bookingStatus)}`}>
                                    {booking.bookingStatus}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatus.colorClass}`}>
                                    {paymentStatus.text}
                                </span>
                            </td>
                        </tr>
                    )
                }) : (
                    <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No bookings found.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}