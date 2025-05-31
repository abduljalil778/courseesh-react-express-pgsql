// TeacherDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../lib/api';
import Spinner from '../components/Spinner';
import CourseForm from '../components/CourseForm'; // Pastikan path ini benar
import Swal from 'sweetalert2';
import {format, parseISO} from 'date-fns';
import {formatCurrencyIDR} from '../utils/formatCurrency';

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
      // PENTING: getAllCourses() untuk teacher dashboard idealnya hanya mengambil
      // kursus yang dibuat oleh teacher yang sedang login.
      // Ini harus dihandle oleh backend berdasarkan `req.user.id`.
      const response = await getAllCourses();
      setCourses(response.data || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
      const errMsg = err.response?.data?.message || 'Could not load your courses. Please try again.';
      setError(errMsg);
      // Tidak perlu Swal di sini untuk error load awal, biarkan UI yang menangani
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

  const handleFormSubmit = async (formData) => {
    const isUpdating = formMode === 'edit';
    const actionText = isUpdating ? 'Updating' : 'Creating';
    const actionSuccessText = isUpdating ? 'Updated' : 'Created';

    // Tombol submit di CourseForm idealnya memiliki state loading sendiri
    // Namun, Swal loading di sini juga bisa diterima.
    Swal.fire({
      title: `${actionText} course...`,
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      if (isUpdating && editingCourse) {
        await updateCourse(editingCourse.id, formData);
      } else {
        await createCourse(formData);
      }
      await loadCourses(); // Muat ulang daftar setelah berhasil
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `Course ${actionSuccessText.toLowerCase()} successfully.`,
        timer: 1500,
        showConfirmButton: false,
      });
      handleCloseForm(); // Tutup form setelah berhasil
    } catch (err) {
      console.error(`Failed to ${actionText.toLowerCase()} course:`, err);
      Swal.fire({ // Tetap tampilkan Swal error untuk operasi CRUD
        icon: 'error',
        title: `Error ${actionText} Course`,
        text: err.response?.data?.message || `Could not ${actionText.toLowerCase()} course. Please try again.`,
      });
      // Jangan tutup form jika error agar pengguna bisa memperbaiki
    }
  };

  const handleDelete = async (courseId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Merah untuk delete
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await deleteCourse(courseId);
        // Jika course yang sedang diedit dihapus, tutup form
        if (editingCourse && editingCourse.id === courseId) {
            handleCloseForm();
        }
        await loadCourses();
        Swal.fire('Deleted!', 'Your course has been deleted.', 'success');
      } catch (err) {
        console.error('Delete failed:', err);
        Swal.fire('Error!', err.response?.data?.message || 'There was a problem deleting the course.', 'error');
      }
    }
  };

  if (isLoading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Spinner size={60} />
      </div>
    );
  }

  if (error && courses.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button
          onClick={loadCourses}
          className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

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

        {error && courses.length > 0 && (
           <div className="p-4 mb-6 text-center text-red-700 bg-red-100 border border-red-300 rounded-md shadow">
             <p className="font-semibold">Could not refresh courses:</p>
             <p>{error} <button onClick={loadCourses} className="ml-2 font-semibold text-blue-600 underline hover:text-blue-800">Try Again</button></p>
           </div>
        )}

        {isLoading && courses.length > 0 && (
          <div className="my-4 text-center">
            <Spinner size={32} />
            <p className="text-sm text-gray-500">Loading courses...</p>
          </div>
        )}

        {!isLoading && courses.length === 0 && !error && (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
          </div>
        )}

        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow duration-300"
              >
                {/* <img src="/placeholder-course.jpg" alt={course.title} className="w-full h-48 object-cover"/> */}
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1 leading-tight">{course.title}</h2>
                  <p className="text-xs text-gray-500 mb-2">
                    {course.classLevel.replace('GRADE_', 'Kelas ')}{course.classLevel !== 'UTBK' ? ` - ${course.curriculum}` : ''} | Sessions: {course.numberOfSessions}
                  </p>
                  <p className="text-sm text-gray-700 mb-3 flex-grow Htruncate_custom_desc_teacher">
                    {course.description || 'No description available.'}
                  </p>
                    <p className="text-2xl font-bold text-indigo-600 mb-4">
                      {formatCurrencyIDR(course.price)}
                  </p>
                  {course.createdAt && (
                    <p className="text-xs text-gray-400 mb-3">
                        Created: {format(parseISO(course.createdAt), 'dd MMM yyyy')}
                    </p>
                  )}
                  <div className="mt-auto flex pt-3 space-x-2 border-t border-gray-200">
                    <button
                      onClick={() => handleEditCourseClick(course)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-center text-white bg-yellow-500 rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="flex-1 px-3 py-2 text-xs font-medium text-center text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
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
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <CourseForm
              key={formMode === 'edit' && editingCourse ? `course-form-${editingCourse.id}` : 'course-form-create'}
              initialData={editingCourse}
              onSubmit={handleFormSubmit}
              onCancel={handleCloseForm} // Pastikan CourseForm memanggil ini
              submitLabel={formMode === 'edit' ? 'Update Course' : 'Create Course'}
            />
          </div>
        </div>
      )}
    </>
  );

}