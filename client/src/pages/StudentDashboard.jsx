// client/src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Pastikan useNavigate diimpor
import { getAllCourses, getCourseReviews } from '../lib/api'; // Impor getCourseReviews jika ingin pre-fetch atau gunakan di modal (Opsi 2)
import Spinner from '../components/Spinner';
import { CLASS_LEVELS, CURRICULA } from '../config';
import { formatCurrencyIDR } from '../utils/formatCurrency';
// Komponen StarRating juga diperlukan jika menampilkan review di modal (Opsi 2)
// import { format, parseISO } from 'date-fns'; 
// const StarRating = ({ rating }) => { ... };


export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterCurriculum, setFilterCurriculum] = useState('');

  // State untuk modal detail kursus TIDAK LAGI DIPERLUKAN JIKA NAVIGASI
  // const [selectedCourse, setSelectedCourse] = useState(null);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate(); // Hook untuk navigasi

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllCourses();
      setCourses(response.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError(err.response?.data?.message || 'Failed to load courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const searchTermLower = searchTerm.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(searchTermLower);
      const descriptionMatch = c.description.toLowerCase().includes(searchTermLower);

      if (searchTerm && !(titleMatch || descriptionMatch)) {
        return false;
      }
      if (filterClass && c.classLevel !== filterClass) {
        return false;
      }
      if (filterClass && filterClass !== 'UTBK' && filterCurriculum && c.curriculum !== filterCurriculum) {
        return false;
      }
      return true;
    });
  }, [courses, searchTerm, filterClass, filterCurriculum]);

  // UBAH FUNGSI INI
  const handleViewDetailsClick = (courseId) => {
    navigate(`/student/courses/${courseId}`); // Navigasi ke halaman CourseDetail
  };

  // HAPUS FUNGSI INI JIKA MODAL TIDAK DIGUNAKAN LAGI
  // const handleCloseModal = () => {
  //   setIsModalOpen(false);
  //   setSelectedCourse(null);
  // };

  // handleBookNowInModal juga tidak relevan jika modal dihapus
  // const handleBookNowInModal = (courseId) => { ... };

  if (isLoading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} />
      </div>
    );
  }

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Search & Filters */}
        {/* ... (kode filter Anda tetap sama) ... */}
        <div className="p-4 bg-gray-50 rounded-lg shadow space-y-4 md:space-y-0 md:flex md:gap-4 md:items-center">
          <input
            type="text"
            placeholder="🔍 Search courses by title or description..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:flex-1 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="flex gap-4">
            <select
              value={filterClass}
              onChange={e => {
                setFilterClass(e.target.value);
                setFilterCurriculum('');
              }}
              className="w-full md:w-auto p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="">All Classes</option>
              {CLASS_LEVELS.map(level => (
                <option key={level} value={level}>
                  {level.replace('GRADE_', 'Kelas ')}{level === 'UTBK' ? '' : ''}
                </option>
              ))}
            </select>

            {filterClass && filterClass !== 'UTBK' && (
              <select
                value={filterCurriculum}
                onChange={e => setFilterCurriculum(e.target.value)}
                className="w-full md:w-auto p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">All Curricula</option>
                {CURRICULA.map(cur => (
                  <option key={cur} value={cur}>
                    {cur === 'MERDEKA' ? 'Kurikulum Merdeka' : 'K13 Revisi'}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 text-center text-red-700 bg-red-100 border border-red-300 rounded-md shadow">
            <p className="font-semibold">Could not load courses:</p>
            <p>{error} <button onClick={fetchCourses} className="ml-2 font-semibold text-blue-600 underline hover:text-blue-800">Retry</button></p>
          </div>
        )}
        {!isLoading && filteredCourses.length === 0 && !error && (
          <p className="py-10 text-center text-xl text-gray-500">
            No courses match your criteria. Try adjusting your search or filters.
          </p>
        )}

        {filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 leading-tight Htruncate_custom">{course.title}</h2>
                  <p className="text-xs text-gray-500 mb-1">
                    {course.classLevel.replace('GRADE_', 'Kelas ')}{course.classLevel !== 'UTBK' ? ` - ${course.curriculum}` : ''}
                  </p>
                  <p className="text-sm text-gray-600 mb-3 flex-grow Htruncate_custom_desc">
                    {course.description}
                  </p>
                  <p className="text-2xl font-bold text-indigo-600 mb-4">{formatCurrencyIDR(course.price)}</p>
                  <button
                    onClick={() => handleViewDetailsClick(course.id)} // Kirim course.id
                    className="mt-auto w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {isLoading && courses.length > 0 && (
          <div className="text-center py-4">
            <Spinner size={32} />
            <p className="text-sm text-gray-500">Refreshing courses...</p>
          </div>
        )}
      </div>

      {/* MODAL TIDAK LAGI DIPERLUKAN JIKA NAVIGASI KE HALAMAN DETAIL */}
      {/* {isModalOpen && selectedCourse && ( ... kode modal ... )} */}
    </>
  );
}