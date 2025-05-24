import { useEffect, useState } from 'react';
import api from '../lib/api';
import CourseCard from '../components/CourseCard';
import Spinner from '../components/Spinner';
import delay from '../utils/delay';
import Swal from 'sweetalert2';

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const promises = [ api.get('/courses') ];
        if (import.meta.env.DEV) promises.push(delay(500));
        const [{ data }] = await Promise.all(promises);
        setCourses(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleBook = async courseId => {
    try {
      const bookingDate = new Date().toISOString();
      await api.post('/bookings', { courseId, bookingDate });
      Swal.fire({
        icon: "success",
        text: "Booked successfully!",
        showConfirmButton: false,
        timer: 2000
      })
    } catch (err) {
      alert(err.response?.data?.message || 'Booking failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={62} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError(null);
          }}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map(c => (
        <CourseCard key={c.id} course={c} onBook={handleBook} />
      ))}
    </div>
  );
}
