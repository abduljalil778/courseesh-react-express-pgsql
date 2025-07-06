// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getPublicCourses } from '../lib/api';
import Spinner from '../components/Spinner';
import { useCourseFilterStore } from '@/stores/courseFilterStore';
import CourseCard from '../components/CourseCard';
import { useAuth } from '../context/AuthContext'; // <-- 1. Impor useAuth untuk mendapatkan data user
import { X } from 'lucide-react';
import { SUBJECT_CATEGORIES } from '@/config';

// Komponen kecil untuk menampilkan 'pil' filter aktif
const ActiveFilterPills = () => {
  const { searchTerm, filterClass, category, setCategory, setFilterClass, setSearchTerm } = useCourseFilterStore();

  // --- 2. Cari label yang sesuai untuk kategori yang aktif ---
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
          {/* --- 3. Tampilkan labelnya di sini --- */}
          {categoryLabel}
          <button onClick={() => setCategory('')} className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-indigo-200">
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
      {filterClass && (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
          {/* Untuk filterClass tidak perlu diubah karena nilainya sudah human-readable */}
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
  const { user } = useAuth(); // <-- 2. Ambil data user yang login
  const [allCourses, setAllCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Hapus state `selectedCategory` yang lama karena sekarang dikelola oleh store
  // const [selectedCategory, setSelectedCategory] = useState('');

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
      // Gunakan getPublicCourses agar lebih jelas
      const response = await getPublicCourses({ searchTerm, category, classLevel: filterClass });
      setAllCourses(response.data?.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, []); // Hapus dependensi agar tidak re-fetch setiap kali filter berubah

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Logika filter sekarang terjadi di sisi klien setelah semua data diambil
  const filteredCourses = useMemo(() => {
    return allCourses.filter(c => {
      const searchTermLower = searchTerm.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(searchTermLower);
      const teacherMatch = c.teacher.name.toLowerCase().includes(searchTermLower);
      const categoryMatch = !category || c.category === category;
      const classLevelMatch = !filterClass || c.classLevels.includes(filterClass);

      return (searchTerm ? titleMatch || teacherMatch : true) && classLevelMatch && categoryMatch;
    });
  }, [allCourses, searchTerm, filterClass, category]);


  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size={60} /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Selamat datang kembali, {user?.name}!
        </h1>
        <p className="mt-2 text-md text-gray-600">Siap untuk belajar hal baru hari ini?</p>
      </div>

      {/* --- BAGIAN 2: TAMPILAN FILTER AKTIF --- */}
      <ActiveFilterPills />

      {/* --- BAGIAN 3: DAFTAR KURSUS --- */}
      {error && <div className="p-4 text-center text-red-700 bg-red-100 rounded-md"><p>{error}</p></div>}
      
      {!isLoading && filteredCourses.length === 0 ? (
        <div className="text-center py-16">
          <h3 className="text-lg font-medium text-gray-900">No Courses Found</h3>
          <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}