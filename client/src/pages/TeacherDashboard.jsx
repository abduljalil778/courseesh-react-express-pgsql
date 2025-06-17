// src/pages/TeacherDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../lib/api';
import Spinner from '../components/Spinner';
import CourseForm from '../components/CourseForm';
import Swal from 'sweetalert2';
import CourseCard from '@/components/CourseCard';

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formMode, setFormMode] = useState(null);

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getAllCourses();
      setCourses(response.data?.courses || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your courses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleAddNewCourseClick = () => {
    setEditingCourse(null);
    setFormMode('create');
  };

  const handleEditCourseClick = (course) => {
    setEditingCourse(course);
    setFormMode('edit');
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setEditingCourse(null);
  };

  const handleDelete = async (courseId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteCourse(courseId);
        if (editingCourse && editingCourse.id === courseId) {
          handleCloseForm();
        }
        await loadCourses();
        Swal.fire('Deleted!', 'Your course has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error!', err.response?.data?.message || 'There was a problem deleting the course.', 'error');
      }
    }
  };

  return (
    <>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Courses</h1>
          <button
            onClick={handleAddNewCourseClick}
            className="mt-3 sm:mt-0 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add New Course
          </button>
        </div>

        {/* Error State */}
        {error && courses.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-xl text-red-600 mb-4">{error}</p>
            <button
              onClick={loadCourses}
              className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && courses.length === 0 && (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <Spinner size={60} />
          </div>
        )}

        {/* No Data State */}
        {!isLoading && courses.length === 0 && !error && (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
          </div>
        )}

        {/* List Courses (pakai CourseCard) */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                showActions={true}
                onEdit={handleEditCourseClick}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal untuk CourseForm */}
      {formMode && (
        <div className="modal-backdrop" onClick={handleCloseForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-xl font-semibold text-gray-800">
                {formMode === 'edit' ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button onClick={handleCloseForm} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <CourseForm
              key={formMode === 'edit' && editingCourse ? `course-form-${editingCourse.id}` : 'course-form-create'}
              initialData={editingCourse}
              onSuccess={async () => {
                await loadCourses();
                handleCloseForm();
              }}
              onSubmit={async (formData, isEditMode, courseId) => {
                if (isEditMode) {
                  await updateCourse(courseId, formData);
                } else {
                  await createCourse(formData);
                }
              }}
              onCancel={handleCloseForm}
              submitLabel={formMode === 'edit' ? 'Update Course' : 'Create Course'}
            />
          </div>
        </div>
      )}
    </>
  );
}
