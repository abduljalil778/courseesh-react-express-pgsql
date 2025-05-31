// src/pages/CourseDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getCourseById } from '../lib/api'; // Gunakan fungsi API
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2'; // Untuk notifikasi error yang lebih baik
import { formatCurrencyIDR } from '../utils/formatCurrency';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourseDetail = useCallback(async () => {
    if (!courseId) {
      setError('No course ID specified.');
      setLoading(false);
      // Tidak perlu navigasi atau alert, cukup tampilkan error di halaman
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getCourseById(courseId);
      setCourse(response.data);
    } catch (err) {
      console.error('Failed to load course details:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load course details.';
      setError(errorMessage);
      Swal.fire({ // Notifikasi error dengan Swal
        icon: 'error',
        title: 'Loading Error',
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetail();
  }, [fetchCourseDetail]);

  if (loading) {
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
          onClick={() => navigate('/student/dashboard')} // Kembali ke dashboard
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
        >
          Back to Dashboard
        </button>
        <button
          onClick={fetchCourseDetail} // Tombol retry
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!course) { // Jika tidak loading, tidak error, tapi course null (misal ID tidak ditemukan)
    return (
      <div className="p-6 text-center text-xl text-gray-600">
        Course not found. It might have been removed or the ID is incorrect.
        <button
          onClick={() => navigate('/student/dashboard')}
          className="block mx-auto mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">{course.title}</h1>
        <div className="space-y-3 text-gray-700 mb-8">
          <p><strong>Teacher:</strong> {course.teacher?.name || 'Information not available'}</p>
          <p><strong>Description:</strong> {course.description || 'No description provided.'}</p>
          <p><strong>Price:</strong> <span className="text-2xl font-semibold text-indigo-600">{formatCurrencyIDR(course.price)}</span></p>
          <p><strong>Total Sessions:</strong> {course.numberOfSessions || 'N/A'}</p>
          <p><strong>Class Level:</strong> {course.classLevel.replace('GRADE_', 'Kelas ')}</p>
          {course.classLevel !== 'UTBK' && <p><strong>Curriculum:</strong> {course.curriculum || 'N/A'}</p>}
        </div>
        <div className="text-center">
          <button
            className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform transform hover:scale-105"
            onClick={() => navigate(`/student/book/${courseId}`)}
          >
            Book This Course Now
          </button>
        </div>
      </div>
    </div>
  );
}