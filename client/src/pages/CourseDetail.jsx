// src/pages/CourseDetail.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { getCourseById, getCourseReviews } from '../lib/api'; // Tambahkan getCourseReviews
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import { formatCurrencyIDR } from '../utils/formatCurrency';
import { format, parseISO } from 'date-fns'; // Untuk format tanggal review

// Komponen kecil untuk menampilkan bintang rating
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span
            key={starValue}
            className={`text-xl ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
};


export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loadingCourse, setLoadingCourse] = useState(true); // Ganti nama state loading
  const [errorCourse, setErrorCourse] = useState(null); // Ganti nama state error

  // State baru untuk reviews
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [errorReviews, setErrorReviews] = useState(null);

  const fetchCourseDetail = useCallback(async () => {
    if (!courseId) {
      setErrorCourse('No course ID specified.');
      setLoadingCourse(false);
      return;
    }
    setLoadingCourse(true);
    setErrorCourse(null);
    try {
      const response = await getCourseById(courseId);
      setCourse(response.data);
    } catch (err) {
      console.error('Failed to load course details:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load course details.';
      setErrorCourse(errorMessage);
      // Hapus Swal dari sini agar tidak muncul dua kali jika fetchReviews juga error
    } finally {
      setLoadingCourse(false);
    }
  }, [courseId]);

  const fetchCourseReviews = useCallback(async () => {
    if (!courseId) {
      // setErrorReviews tidak perlu diset di sini karena sudah ditangani fetchCourseDetail
      setLoadingReviews(false);
      return;
    }
    setLoadingReviews(true);
    setErrorReviews(null);
    try {
      const response = await getCourseReviews(courseId);
      setReviews(response.data || []);
    } catch (err) {
      console.error('Failed to load course reviews:', err);
      setErrorReviews(err.response?.data?.message || 'Failed to load reviews.');
    } finally {
      setLoadingReviews(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetail();
    fetchCourseReviews(); // Panggil juga fetch reviews
  }, [fetchCourseDetail, fetchCourseReviews]); // Tambahkan fetchCourseReviews sebagai dependency

  // Tampilkan loading utama jika salah satu masih loading
  if (loadingCourse || loadingReviews) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} />
      </div>
    );
  }
  
  // Tampilkan error utama jika data kursus gagal dimuat
  if (errorCourse) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{errorCourse}</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-2"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => { fetchCourseDetail(); fetchCourseReviews(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!course) {
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
          <p><strong>Class Level:</strong> {course.classLevels?.join(', ') || 'N/A'}</p>
            {!(course.classLevels?.includes('UTBK') && course.classLevels?.length === 1) && course.curriculum && (
          <p><strong>Curriculum:</strong> {course.curriculum}</p>
            )}
        </div>
        <div className="text-center mb-10">
          <button
            className="bg-green-600 text-white py-3 px-8 rounded-lg font-semibold text-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-transform transform hover:scale-105"
            onClick={() => navigate(`/student/book/${courseId}`)}
          >
            Book This Course Now
          </button>
        </div>

        {/* BAGIAN REVIEW KURSUS */}
        <div className="mt-10 pt-6 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Student Reviews</h2>
          {errorReviews && (
            <p className="text-red-500 text-center">Could not load reviews: {errorReviews}</p>
          )}
          {!loadingReviews && reviews.length === 0 && !errorReviews && (
            <p className="text-gray-500 text-center italic">No reviews yet for this course. Be the first to review after completing it!</p>
          )}
          {reviews.length > 0 && (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center mb-2">
                    <StarRating rating={review.rating} />
                    <span className="ml-3 text-sm font-medium text-gray-700">{review.student?.name || 'Anonymous Student'}</span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 italic mb-1">"{review.comment}"</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Reviewed on: {format(parseISO(review.createdAt), 'dd MMM yyyy')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}