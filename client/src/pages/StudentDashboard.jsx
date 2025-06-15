// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getAllCourses } from '../lib/api';
import Spinner from '../components/Spinner';
import { useCourseFilterStore } from '@/stores/courseFilterStore';
import CourseCard from '../components/CourseCard'; 
import { SUBJECT_CATEGORIES } from '@/config';

export default function StudentDashboard() {
  const [allCourses, setAllCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');

  const { searchTerm, filterClass, clearFilters } = useCourseFilterStore();

  useEffect(() => {
    return () => {
      clearFilters();
    }
  }, [clearFilters]);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllCourses();
      setAllCourses(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filteredCourses = useMemo(() => {
    return allCourses.filter(c => {
      const searchTermLower = searchTerm.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(searchTermLower);
      const descriptionMatch = c.description.toLowerCase().includes(searchTermLower);
      const classLevelMatch = filterClass ? c.classLevels.includes(filterClass) : true;
      const categoryMatch = selectedCategory ? c.category === selectedCategory : true;

      return (searchTerm ? titleMatch || descriptionMatch : true) && classLevelMatch && categoryMatch;
    });
  }, [allCourses, searchTerm, filterClass, selectedCategory]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Spinner size={60} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex overflow-x-auto space-x-4 pb-2">
        {SUBJECT_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value === selectedCategory ? '' : cat.value)}
            className={`flex flex-col items-center px-3 py-2 rounded-md border ${selectedCategory === cat.value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            <span className="text-2xl">{cat.icon}</span>
            <span className="text-xs mt-1 whitespace-nowrap">{cat.label}</span>
          </button>
        ))}
      </div>
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