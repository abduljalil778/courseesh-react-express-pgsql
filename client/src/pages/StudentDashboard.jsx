import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPublicCourses } from '../lib/api';
import { useCourseFilterStore } from '@/stores/courseFilterStore';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/skeleton/CourseCardSkeleton';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';
import { SUBJECT_CATEGORIES } from '@/config';

// Komponen kecil untuk menampilkan 'pil' filter aktif
const ActiveFilterPills = () => {
  const { searchTerm, filterClass, category, setCategory, setFilterClass, setSearchTerm } = useCourseFilterStore();

  // Cari label yang sesuai untuk kategori yang aktif
  const categoryLabel = useMemo(() => {
    if (!category) return ''; // Jika tidak ada kategori, kembalikan string kosong
    // Cari objek di dalam SUBJECT_CATEGORIES yang value-nya cocok dengan state category
    const foundCategory = SUBJECT_CATEGORIES.find(cat => cat.value === category);
    // Kembalikan labelnya, atau value aslinya jika tidak ditemukan
    return foundCategory ? foundCategory.label : category;
  }, [category]); // Dihitung ulang hanya saat `category` berubah

  const hasActiveFilters = searchTerm || filterClass || category;

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="mb-6 flex items-center flex-wrap gap-2">
      <span className="text-sm font-medium text-gray-600">Filtering by:</span>
      {category && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
          {categoryLabel}
          <button onClick={() => setCategory('')} className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-indigo-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
      {filterClass && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
          {filterClass}
          <button onClick={() => setFilterClass('')} className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-gray-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
       {searchTerm && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
          "{searchTerm}"
          <button onClick={() => setSearchTerm('')} className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-yellow-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </div>
  );
};


export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ambil semua state dan setter yang relevan dari store
  const { searchTerm, filterClass, category, clearFilters } = useCourseFilterStore();

  // Kosongkan filter saat komponen unmount
  useEffect(() => {
    return () => {
      clearFilters();
    }
  }, [clearFilters]);

  // Fetch data kursus
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        search: searchTerm,
        category: category,
        classLevel: filterClass,
      };
      // Kirim parameter filter ke backend
      const response = await getPublicCourses(params);
      setCourses(response.data?.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterClass, category]); // dependensi filter

  // useEffect bergantung pada fungsi fetchCourses
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Selamat datang kembali, {user?.name}!
        </h1>
        <p className="mt-2 text-md text-gray-600">Siap untuk belajar hal baru hari ini?</p>
      </div>

      <ActiveFilterPills />

      {error && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md"><p>{error}</p></div>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          // Tampilkan 8 kerangka saat loading
          Array.from({ length: 8 }).map((_, index) => <CourseCardSkeleton key={index} />)
        ) : courses.length === 0 ? (
          // Tampilkan pesan "tidak ditemukan" di dalam kontainer grid 
          <div className="col-span-full text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No Courses Found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          // Tampilkan data kursus yang sebenarnya
          courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))
        )}
      </div>
    </div>
  );
}