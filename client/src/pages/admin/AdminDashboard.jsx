import React, { useEffect, useState, useCallback } from 'react';
import { getAdminDashboardStats } from '../../lib/api';
import AdminDashboardSkeleton from '@/components/skeleton/AdminDashboardSkeleton';
import { formatCurrencyIDR } from '../../utils/formatCurrency';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, UserCheck, User, BookOpen, CalendarCheck } from 'lucide-react';

// Untuk warna Pie Chart
const COLORS = ['#4F46E5', '#6366F1', '#818CF8', '#A5B4FC', '#C7D2FE'];

const StatCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white p-4 rounded-lg shadow-lg flex items-center">
    <div className="p-2.5 bg-primary/10 rounded-full">
      {Icon && <Icon className="h-3 w-3 text-primary" />}
    </div>
    <div className="ml-4">
      <p className="text-xs font-medium text-gray-500 uppercase">{title}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

const CoursePopularityChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        outerRadius={80}
        fill="#4F46E5"
        dataKey="count"
        nameKey="name"
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
      >
        {data.map((entry, idx) => (
          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip formatter={v => `${v} bookings`} />
    </PieChart>
  </ResponsiveContainer>
);

const TeacherRevenueRanking = ({ data }) => (
  <div className="overflow-hidden rounded-md border">
    <div className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
      <span role="img" aria-label="star" className="mr-2">⭐</span>
      Top Teachers by Revenue
    </div>
    <ul className="divide-y divide-gray-200">
      {data.length > 0 ? data.map((teacher, idx) => (
        <li key={teacher.name} className="px-4 py-3 flex items-center justify-between text-sm">
          <span className="font-medium text-gray-800">{idx+1}. {teacher.name}</span>
          <span className="text-gray-600 font-mono">{formatCurrencyIDR(teacher.revenue)}</span>
        </li>
      )) : (
        <li className="px-4 py-3 text-sm text-gray-500">No data available.</li>
      )}
    </ul>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAdminDashboardStats();
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Map label coursePopularityStats
  // const coursePopularityData = (stats?.coursePopularityStats || []).map(item => ({
  //   ...item,
  //   label: getCategoryLabel(item.name), // Ubah nama enum ke label
  // }));

  if (isLoading) return <AdminDashboardSkeleton />

  if (error) return <p className="text-red-500 p-4">{error}</p>;
  
  if (!stats) return <p className="text-gray-500">No statistics to display.</p>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Kartu KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard title="Total Revenue" value={formatCurrencyIDR(stats.kpi.totalRevenue)} icon={DollarSign} />
        <StatCard title="Total Users" value={stats.kpi.totalUsers} icon={Users} />
        <StatCard title="Total Teachers" value={stats.kpi.totalTeachers} icon={UserCheck} />
        <StatCard title="Total Students" value={stats.kpi.totalStudents} icon={User} />
        <StatCard title="Total Courses" value={stats.kpi.totalCourses} icon={BookOpen} />
        <StatCard title="Active Bookings" value={stats.kpi.activeBookings} icon={CalendarCheck} />
      </div>

      {/* Grafik utama */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Bookings in Last 30 Days</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.bookingStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Bookings" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Grafik sekunder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Most Popular Courses <span className="text-xs text-gray-400 font-normal">(Top 5 by Booking)</span>
          </h3>
          <CoursePopularityChart data={stats.coursePopularityStats || []} />
        </div>
        <TeacherRevenueRanking data={stats.teacherRevenueRanking || []} />
      </div>
    </div>
  );
}
