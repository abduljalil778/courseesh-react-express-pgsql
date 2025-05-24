import { useEffect, useState } from 'react';
import api from '../lib/api';
import Spinner from '../components/Spinner';
import PaymentForm from '../components/PaymentForm';
import Swal from 'sweetalert2';
import UserForm from '../components/UserForm';

export default function AdminDashboard() {
  const [users, setUsers]           = useState([]);
  const [courses, setCourses]       = useState([]);
  const [bookings, setBookings]     = useState([]);
  const [payments, setPayments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // load both users+payments
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, courseRes, bookingRes, paymentRes] = await Promise.all([
        api.get('/users'),
        api.get('/courses'),
        api.get('/bookings'),
        api.get('/payments')
      ]);
      setUsers(userRes.data);
      setCourses(courseRes.data);
      setBookings(bookingRes.data);
      setPayments(paymentRes.data);
    } catch {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // create or update user
  const handleUserSubmit = async (data) => {
    if (editingUser) {
      await api.put(`/users/${editingUser.id}`, data);
    } else {
      await api.post('/users', data);
    }
    setEditingUser(null);
    loadData();
  };

  // delete user
  const handleUserDelete = async (id) => {
    if (confirm('Delete this user?')) {
      await api.delete(`/users/${id}`);
      // if we were editing them, cancel edit
      if (editingUser?.id === id) setEditingUser(null);
      loadData();
    }
  };

  // create payment
  const handleCreatePayment = async data => {
    try {
      await api.post('/payments', data);
      loadData();
    } catch {
      Swal.fire({
        icon: "error",
        text: "Something went wrong!",
        title: "Oops...",
        footer: "failed to create payment"
      })
    }
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
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* User Management */}
      <section>
        <h2 className="text-2xl font-bold mb-4">
          {editingUser ? 'Edit User' : 'Add New User'}
        </h2>
        <UserForm
          initial={editingUser || {}}
          onSubmit={handleUserSubmit}
          submitLabel={editingUser ? 'Update User' : 'Create User'}
        />
        <h3 className="text-xl font-semibold mt-6">All Users</h3>
        <ul className="mt-2 space-y-2">
          {users.map(u => (
            <li key={u.id} className="flex justify-between items-center p-2 border rounded">
              <div>
                <p>
                  <strong>{u.name}</strong> ({u.email}) — {u.role} — {u.status}
                </p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingUser(u)}
                  className="px-2 py-1 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleUserDelete(u.id)}
                  className="px-2 py-1 bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ——— Course Overview ——— */}
      <section>
        <h2 className="text-2xl font-bold mb-4">All Courses</h2>
        {courses.length === 0 ? (
          <p>No courses found.</p>
        ) : (
          <ul className="space-y-2">
            {courses.map(c => (
              <li key={c.id} className="p-3 border rounded">
                <p className="font-semibold">{c.title}</p>
                <p>
                  Teacher: <strong>{c.teacher.name}</strong> ({c.teacher.email})
                </p>
                <p>Price: ${c.price.toFixed(2)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ——— Bookings Overview ——— */}
      <section>
        <h2 className="text-2xl font-bold mb-4">All Bookings</h2>

        {bookings.length === 0 ? (
          <p>No bookings have been made yet.</p>
        ) : (
          <ul className="space-y-3">
            {bookings.map(b => (
              <li key={b.id} className="border p-4 rounded">
                <p>
                  <strong>Booking ID:</strong> {b.id}
                </p>
                <p>
                  <strong>Student:</strong> {b.student.email} ({b.student.name})
                </p>
                <p>
                  <strong>Course:</strong> {b.course.title} by {b.course.teacher.name}
                </p>
                <p>
                  <strong>Date:</strong>{' '}
                  {new Date(b.bookingDate).toLocaleString()}
                </p>
                <p>
                  <strong>Status:</strong> {b.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Payment Management */}
      <section>
        <h2 className="text-2xl font-bold mb-4">New Payment</h2>
        <PaymentForm onSubmit={handleCreatePayment} />

        <h3 className="text-xl font-semibold mt-8">All Payments</h3>
        <ul className="mt-2 space-y-1">
          {payments.map(p => (
            <li key={p.id}>
              {p.booking.student.email} paid ${p.amount} for {p.booking.course.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
