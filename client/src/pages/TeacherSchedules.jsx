// client/src/pages/TeacherSchedules.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBookings } from '../lib/api';
import Spinner from '../components/Spinner';
import { format, parseISO } from 'date-fns';

export default function TeacherSchedules() {
  const [activeBookings, setActiveBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const loadActiveBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllBookings();
      const relevantBookings = (response.data || []).filter(
        booking => booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED'
      );
      setActiveBookings(relevantBookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load active bookings.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveBookings();
  }, [loadActiveBookings]);

  if (isLoading) return <div className="flex justify-center items-center h-screen"><Spinner size={60} /></div>;
  if (error) return <div className="p-6 text-center text-red-500">{error} <button onClick={loadActiveBookings} className="text-blue-500 underline ml-2">Retry</button></div>;
  if (!activeBookings.length) return <div className="p-6 text-center text-gray-500">You have no confirmed or completed bookings to manage.</div>;

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 pb-4 border-b">
        Teaching Schedule & Reports
      </h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activeBookings.map(booking => {
              const completedSessions = booking.sessions?.filter(s => s.status === 'COMPLETED').length || 0;
              const totalSessions = booking.sessions?.length || 0;

              return (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{booking.course?.title}</div>
                    <div className="text-xs text-gray-500">Booked: {format(parseISO(booking.createdAt), 'dd MMM yyyy')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{booking.student?.name}</div>
                    <div className="text-xs text-gray-500">{booking.student?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {completedSessions} / {totalSessions} Sessions Completed
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      booking.bookingStatus === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {booking.bookingStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/teacher/schedules/${booking.id}`)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Manage & View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}