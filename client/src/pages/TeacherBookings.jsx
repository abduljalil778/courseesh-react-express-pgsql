import { useEffect, useState } from 'react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';

export default function TeacherBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/bookings');
      setBookings(data);
    } catch {
      setError('Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleChange = async (id, status) => {
    try {
      await api.put(`/bookings/${id}`, { status });
      loadBookings();
    } catch {
      // alert('Could not update booking status');
      Swal.fire({
        title: "Oops...",
        text: "Could not update booking status",
        icon: "error"
      })
    }
  };

  // 1️⃣ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={64} />
      </div>
    );
  }

  // 2️⃣ Error state
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadBookings}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // 3️⃣ Empty state
  if (bookings.length === 0) {
    return <p className="p-6 text-center">No one has booked your courses yet.</p>;
  }

  // 4️⃣ Normal render
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Course Bookings</h1>
      <ul className="space-y-3">
        {bookings.map(b => (
          <li key={b.id} className="border p-3 rounded">
            <p>
              <strong>{b.student.email}</strong> booked{' '}
              <em>{b.course.title}</em> on{' '}
              {new Date(b.bookingDate).toLocaleString()}
            </p>
            <div className="space-x-2 mt-2">
              {b.status === 'PENDING' ? (
                <>
                  <button
                    onClick={() => handleChange(b.id, 'CONFIRMED')}
                    className="px-2 py-1 bg-green-600 text-white rounded"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleChange(b.id, 'CANCELLED')}
                    className="px-2 py-1 bg-red-600 text-white rounded"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <span>Status: {b.status}</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
