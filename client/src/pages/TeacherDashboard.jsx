import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getTeacherDashboardStats } from '@/lib/api';
import Spinner from '@/components/Spinner';
import { formatCurrencyIDR } from '@/utils/formatCurrency';
import { DollarSign, Users, BookOpen, CalendarCheck } from 'lucide-react';
// import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Komponen Kartu Statistik
const StatCard = ({ title, value, icon: Icon, isLoading }) => (
  <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
    {isLoading ? (
      <div className="animate-pulse flex items-center w-full">
        <div className="p-4 bg-gray-200 rounded-full mr-4"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ) : (
      <>
        <div className="p-3 bg-indigo-100 rounded-full">
          {Icon && <Icon className="h-6 w-6 text-indigo-600" />}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
      </>
    )}
  </div>
);

export default function TeacherDashboard() {
  // const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTeacherDashboardStats(); 
      setStats(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);
  
  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="p-4 text-center text-red-700 bg-red-100 rounded-md">
            <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to='/teacher/payouts' >
        <StatCard
          title="Total Revenue" 
          value={isLoading ? '...' : formatCurrencyIDR(stats?.kpi?.totalRevenue)} 
          icon={DollarSign}
          isLoading={isLoading}
        />
        </Link>
        <StatCard 
          title="Total Students" 
          value={isLoading ? '...' : stats?.kpi?.totalStudents} 
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard 
          title="My Courses" 
          value={isLoading ? '...' : stats?.kpi?.totalCourses} 
          icon={BookOpen}
          isLoading={isLoading}
        />
        <StatCard 
          title="Active Bookings" 
          value={isLoading ? '...' : stats?.kpi?.activeBookings} 
          icon={CalendarCheck}
          isLoading={isLoading}
        />
      </div>
      
      {/* CHART BARU UNTUK BOOKING FREQUENCY */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Booking in Last 30 Days</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-72"><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.bookingStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Bookings" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}