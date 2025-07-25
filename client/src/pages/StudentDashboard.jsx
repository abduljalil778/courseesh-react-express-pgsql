import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllCourses, getAllCategories } from '../lib/api'; // 1. Impor getAllCategories
import { useCourseFilterStore } from '@/stores/courseFilterStore';
import CourseCard from '../components/CourseCard';
import CourseCardSkeleton from '../components/skeleton/CourseCardSkeleton';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

// 2. Komponen 'ActiveFilterPills' sekarang menerima 'categories' sebagai prop
const ActiveFilterPills = ({ categories }) => {
  const { searchTerm, filterClass, category, setCategory, setFilterClass, setSearchTerm } = useCourseFilterStore();

  const categoryLabel = useMemo(() => {
    if (!category || categories.length === 0) return '';
    // Cari nama kategori dari data API berdasarkan ID yang aktif
    const foundCategory = categories.find(cat => cat.id === category);
    return foundCategory ? foundCategory.name : category;
  }, [category, categories]);

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
  
  // 3. State untuk menyimpan daftar kategori dari API
  const [categories, setCategories] = useState([]);
  
  const { searchTerm, filterClass, category, clearFilters } = useCourseFilterStore();

  useEffect(() => {
    return () => {
      clearFilters();
    }
  }, [clearFilters]);

  // 4. useEffect untuk mengambil data kategori saat komponen dimuat
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getAllCategories();
        setCategories(response.data.data || []);
      } catch (err) {
        console.error("Failed to load categories for dashboard:", err);
      }
    };
    fetchCategories();
  }, []);


  // Fetch data kursus (tidak ada perubahan di sini)
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        search: searchTerm,
        category: category,
        classLevel: filterClass,
      };
      const response = await getAllCourses(params);
      setCourses(response.data?.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filterClass, category]);

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

      {/* 5. Teruskan state 'categories' sebagai prop */}
      <ActiveFilterPills categories={categories} />

      {error && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md"><p>{error}</p></div>}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, index) => <CourseCardSkeleton key={index} />)
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <h3 className="text-lg font-medium text-gray-900">No Courses Found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))
        )}
      </div>
    </div>
  );
}