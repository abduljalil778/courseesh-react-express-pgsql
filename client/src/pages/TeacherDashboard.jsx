import { useEffect, useState } from 'react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import CourseForm from '../components/CourseForm';
import Swal from 'sweetalert2';

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // fetch courses, showing spinner & error
  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch {
      setError('Could not load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async data => {
    await api.post('/courses', data);
    loadCourses();
  };

  const handleUpdate = async data => {
    await api.put(`/courses/${editing.id}`, data);
    setEditing(null);
    loadCourses();
  };

  const handleDelete = id => {
  Swal.fire({
    title: "Are you sure?",
    text: "You won't be able to revert this!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, delete it!"
    }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await api.delete(`/courses/${id}`);
        loadCourses();
        Swal.fire(
          "Deleted!",
          "Your course has been deleted.",
          "success"
        );
      } catch (error) {
        Swal.fire(
          "Error!",
          "There was a problem deleting the file.",
          "error"
        );
        console.error("Delete failed:", error);
      }
    }
  });
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={64} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadCourses}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">My Courses</h1>

      {!editing ? (
        <CourseForm
          onSubmit={handleCreate}
          submitLabel="Create Course"
        />
      ) : (
        <CourseForm
          initial={editing}
          onSubmit={handleUpdate}
          submitLabel="Update Course"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {courses.map(c => (
          <div key={c.id} className="p-4 border rounded space-y-2">
            <h2 className="font-semibold">{c.title}</h2>
            <p>${c.price.toFixed(2)}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditing(c)}
                className="px-2 py-1 bg-yellow-500 text-white"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="px-2 py-1 bg-red-600 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
