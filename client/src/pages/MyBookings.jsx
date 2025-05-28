// src/pages/MyBookings.jsx
import { useEffect, useState } from 'react';
import api from '../lib/api';
import BookingRow from '../components/BookingRow';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    try {
      const { data } = await api.get('/bookings');
      setBookings(data);
    } catch {
      alert('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = id => {
    Swal.fire({
        text: "Are you sure?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, cancel it!"
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await api.put(`/bookings/${id}`, { bookingStatus: 'CANCELLED' });
              load();
              Swal.fire({
                text: "Canceled",
                icon: "success",
                timer: 2000,
                showConfirmButton: false
              })
            } catch {
              Swal.fire({
                icon: "error",
                text: "Could not cancel booking"
              })
            }
          }
        })
  };

  if (loading) {
    return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={64} />
    </div>
  );
  }
  if (!bookings.length) return <p>You have no bookings yet.</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Bookings</h1>
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Course</th>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <BookingRow key={b.id} booking={b} onCancel={handleCancel} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
