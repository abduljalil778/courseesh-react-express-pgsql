// src/pages/admin/CourseManagementPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getAllCourses, deleteCourse } from '../../lib/api'; // Pastikan deleteCourse ada di api.js jika ingin digunakan
import { formatCurrencyIDR } from '../../utils/formatCurrency';
import Spinner from '../../components/Spinner';
import Swal from 'sweetalert2';

export default function CourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllCourses(); // Ini akan mengambil semua kursus
      setCourses(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Handler untuk hapus course (jika diperlukan oleh admin)
  const handleDeleteCourse = async (courseId, courseTitle) => {
    const result = await Swal.fire({
        title: `Delete "${courseTitle}"?`,
        text: "This will also delete associated bookings and data. This action is irreversible.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
        try {
            await deleteCourse(courseId);
            Swal.fire('Deleted!', 'The course has been deleted.', 'success');
            loadCourses();
        } catch (err) {
            Swal.fire('Error!', err.response?.data?.message || 'Could not delete the course.', 'error');
        }
    }
  };


  if (isLoading) return <div className="flex justify-center p-8"><Spinner size={48} /></div>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Course Management</h1>
      
      <div className="bg-white rounded-lg shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Levels</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {courses.length > 0 ? courses.map(course => (
                    <tr key={course.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{course.title}</div>
                            <div className="text-sm text-gray-500">{course.numberOfSessions} sessions</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{course.teacher?.name || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {course.classLevels?.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrencyIDR(course.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            {/* Aksi seperti edit atau view detail bisa ditambahkan di sini */}
                            <button onClick={() => handleDeleteCourse(course.id, course.title)} className="text-red-600 hover:text-red-900">
                                Delete
                            </button>
                        </td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No courses found.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
}