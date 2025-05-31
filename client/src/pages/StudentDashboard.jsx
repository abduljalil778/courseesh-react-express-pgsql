// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllCourses } from '../lib/api'; // Gunakan fungsi API
import Spinner from '../components/Spinner';
import { CLASS_LEVELS, CURRICULA } from '../config'; // Pastikan path benar
import { formatCurrencyIDR } from '../utils/formatCurrency';


export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // State untuk error fetching

  // State untuk filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterCurriculum, setFilterCurriculum] = useState('');

  // State untuk modal detail kursus
  const [selectedCourse, setSelectedCourse] = useState(null); // Kursus yang dipilih untuk modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllCourses(); // Menggunakan fungsi API
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

  const handleViewDetailsClick = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null); // Reset selected course
  };

  const handleBookNowInModal = (courseId) => {
    handleCloseModal(); // Tutup modal dulu
    navigate(`/student/book/${courseId}`); // Navigasi ke halaman booking
  };

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
                  {level.replace('GRADE_', 'Kelas ')}{level === 'UTBK' ? ' (UTBK)' : ''}
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
        
        {/* Error Display */}
        {error && (
          <div className="p-4 text-center text-red-700 bg-red-100 border border-red-300 rounded-md shadow">
            <p className="font-semibold">Could not load courses:</p>
            <p>{error} <button onClick={fetchCourses} className="ml-2 font-semibold text-blue-600 underline hover:text-blue-800">Retry</button></p>
          </div>
        )}

        {/* Course Grid */}
        {!isLoading && filteredCourses.length === 0 && !error && (
          <p className="py-10 text-center text-xl text-gray-500">
            No courses match your criteria. Try adjusting your search or filters.
          </p>
        )}

        {filteredCourses.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <div key={course.id} className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
                {/* Anda bisa menambahkan gambar kursus di sini jika ada */}
                {/* <img src={course.imageUrl || '/placeholder-image.jpg'} alt={course.title} className="w-full h-48 object-cover"/> */}
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
                    onClick={() => handleViewDetailsClick(course)}
                    className="mt-auto w-full bg-indigo-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
         {isLoading && courses.length > 0 && ( // Spinner loading halus jika sedang refresh
            <div className="text-center py-4">
                <Spinner size={32} />
                <p className="text-sm text-gray-500">Refreshing courses...</p>
            </div>
        )}
      </div>

      {/* Modal untuk Detail Kursus */}
      {isModalOpen && selectedCourse && (
        <div className="modal-backdrop" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button onClick={handleCloseModal} className="modal-close-button" aria-label="Close modal">&times;</button>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">{selectedCourse.title}</h2>
            <div className="space-y-3 text-gray-700">
              <p><strong>Teacher:</strong> {selectedCourse.teacher?.name || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedCourse.description}</p>
              <p><strong>Class Level:</strong> {selectedCourse.classLevel.replace('GRADE_', 'Kelas ')}</p>
              {selectedCourse.classLevel !== 'UTBK' && <p><strong>Curriculum:</strong> {selectedCourse.curriculum}</p>}
              <p><strong>Number of Sessions:</strong> {selectedCourse.numberOfSessions}</p>
              <p className="text-2xl font-semibold text-indigo-600">Price: {formatCurrencyIDR(selectedCourse.price)}</p>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-200 text-right">
              <button
                onClick={() => handleBookNowInModal(selectedCourse.id)}
                className="bg-green-600 text-white py-2.5 px-6 rounded-md font-semibold hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
