import React, { useEffect, useState, useCallback } from 'react';
// Impor fungsi API yang baru
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllCourses, 
  getAllBookings,
  getAllPayments,
  updatePayment,
} from '../lib/api'; // Pastikan path ini benar
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import UserForm from '../components/UserForm';
import PaymentStatusForm from '../components/PaymentStatusForm';
import {format, parseISO} from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';


export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [userFormMode, setUserFormMode] = useState(null);

  // State untuk modal detail booking (opsional, jika ingin menampilkan detail booking lebih lanjut)
  // const [selectedBookingDetail, setSelectedBookingDetail] = useState(null);
  // const [isBookingDetailModalOpen, setIsBookingDetailModalOpen] = useState(false);
  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Gunakan fungsi API yang sudah diimpor
      const [usersResponse, coursesResponse, bookingsResponse, paymentsResponse] = await Promise.all([
        getAllUsers(),
        getAllCourses(),
        getAllBookings(),
        getAllPayments(),
      ]);
      setUsers(usersResponse.data || []);
      setCourses(coursesResponse.data || []);
      setBookings(bookingsResponse.data || []);
      setPayments(paymentsResponse.data || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load admin data. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- User Management Handlers ---
  const handleOpenCreateUserForm = () => {
    setEditingUser(null);
    setUserFormMode('create');
  };

  const handleOpenEditUserForm = (user) => {
    setEditingUser(user);
    setUserFormMode('edit');
  };

  const handleCloseUserForm = () => {
    setUserFormMode(null);
    setEditingUser(null);
  };

  const handleUserSubmit = async (userData) => {
    const isUpdating = userFormMode === 'edit';
    const actionText = isUpdating ? 'Updating' : 'Creating';
    const successMessage = `User ${isUpdating ? 'updated' : 'created'} successfully.`;
    const failureMessage = `Could not ${isUpdating ? 'update' : 'create'} user.`;

    Swal.fire({
        title: `${actionText} user...`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
    });

    try {
      if (isUpdating && editingUser) {
        // Gunakan fungsi updateUser
        await updateUser(editingUser.id, userData);
      } else {
        // Gunakan fungsi createUser
        await createUser(userData);
      }
      await loadData();
      handleCloseUserForm();
      Swal.fire('Success!', successMessage, 'success');
    } catch (err) {
      console.error(err);
      Swal.fire('Error!', err.response?.data?.message || failureMessage, 'error');
    }
  };

  const handleUserDelete = async (userId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this user!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        // Gunakan fungsi deleteUser
        await deleteUser(userId);
        if (editingUser?.id === userId) {
          handleCloseUserForm();
        }
        await loadData();
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      } catch (err) {
        console.error(err);
        Swal.fire('Error!', err.response?.data?.message || 'Could not delete user.', 'error');
      }
    }
  };

  // --- Payment Management Handler ---
  const handlePaymentStatusUpdate = async (paymentId, newStatus) => {
    try {
      await updatePayment(paymentId, { status: newStatus });
      // Update state lokal untuk 'payments' (daftar semua cicilan)
      setPayments(prevPayments =>
        prevPayments.map(p =>
          p.id === paymentId ? { ...p, status: newStatus } : p
        )
      );
      // Juga update state 'bookings' jika ingin merefleksikan perubahan status cicilan di sana
      setBookings(prevBookings =>
        prevBookings.map(b => ({
          ...b,
          payments: b.payments?.map(p =>
            p.id === paymentId ? { ...p, status: newStatus } : p
          )
        }))
      );
      Swal.fire('Success!', 'Payment installment status updated.', 'success');
    } catch (err) {
      console.error('Failed to update payment status:', err);
      Swal.fire('Error!', err.response?.data?.message || 'Could not update payment installment status.', 'error');
      // Pertimbangkan loadData() jika ingin sinkronisasi penuh dari server pasca error
      loadData();
    }
  };

  // --- Handler untuk update status booking keseluruhan (jika admin bisa) ---
  // const handleBookingStatusUpdate = async (bookingId, newBookingStatus) => { ... }

  // ... (Bagian render JSX tetap sama seperti sebelumnya)
  // Pastikan semua path impor komponen (Spinner, UserForm, PaymentStatusForm) sudah benar.

  if (loading && !users.length && !courses.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size={64} />
      </div>
    );
  }

  if (error && !users.length && !courses.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <p className="text-2xl text-red-600 mb-4">Oops! Something went wrong.</p>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const getOverallPaymentStatusForBooking = (booking) => {
    if (!booking.payments || booking.payments.length === 0) {
      return 'NO_PAYMENTS'; // Atau PENDING jika booking baru dibuat
    }
    const allPaid = booking.payments.every(p => p.status === 'PAID');
    if (allPaid) return 'COMPLETED';
    const somePaid = booking.payments.some(p => p.status === 'PAID');
    if (somePaid) return 'PARTIALLY_PAID';
    if (booking.payments.some(p => p.status === 'FAILED')) return 'HAS_FAILED';
    return 'PENDING_PAYMENTS'; // Jika semua PENDING atau campuran PENDING & FAILED
  };

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8 space-y-10">
        {/* Global Error Display */}
        {error && (users.length > 0 || courses.length > 0) && (
            <div className="p-4 my-4 text-center text-red-700 bg-red-100 border border-red-300 rounded-md shadow">
                <p className="font-semibold">An error occurred:</p>
                <p>{error} <button onClick={loadData} className="ml-2 font-semibold text-blue-600 underline hover:text-blue-800">Retry</button></p>
            </div>
        )}

        {/* --- User Management --- */}
        <section className="p-4 bg-white shadow rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">User Management</h2>
            <button onClick={handleOpenCreateUserForm} className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
              Add New User
            </button>
          </div>
          {loading && !users.length ? <Spinner/> : users.length === 0 ? (<p className="text-gray-500">No users found.</p>) : (
            <ul className="space-y-3">
              {users.map((u) => (
                <li key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md hover:shadow-md transition-shadow">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-700">{u.name} <span className="text-sm text-gray-500">({u.email})</span></p>
                    <p className="text-xs text-gray-500">Phone: {u.phone || '-'}</p>
                    <p className="text-xs text-gray-500">
                      Role: <span className="font-medium text-indigo-600">{u.role}</span> | Status: <span className={`font-medium ${u.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{u.status}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={() => handleOpenEditUserForm(u)} className="px-3 py-1 text-xs text-white bg-yellow-500 rounded hover:bg-yellow-600">Edit</button>
                    <button onClick={() => handleUserDelete(u.id)} className="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ——— Course Overview ——— */}
        <section className="p-4 bg-white shadow rounded-lg">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 pb-4 border-b">Course Overview</h2>
          {loading && !courses.length ? <Spinner/> : courses.length === 0 ? (
            <p className="text-gray-500">No courses found.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((c) => (
                <li key={c.id} className="p-3 border rounded-md">
                  <p className="font-semibold text-gray-700">{c.title}</p>
                  <p className="text-sm text-gray-600">
                    Teacher: <strong>{c.teacher?.name || 'N/A'}</strong> ({c.teacher?.email || 'N/A'})
                  </p>
                  <p className="text-sm text-gray-600">Price: {formatCurrencyIDR(c.price)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ——— Bookings Overview ——— */}
        <section className="p-4 bg-white shadow rounded-lg">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 pb-4 border-b">Bookings Overview</h2>
          {loading && !bookings.length ? <Spinner/> : bookings.length === 0 ? (
            <p className="text-gray-500">No bookings have been made yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Info</th>
                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th> */}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((b) => {
                    const overallPaymentStatus = getOverallPaymentStatusForBooking(b);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{b.student?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{b.student?.email || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{b.course?.title || 'N/A'}</div>
                          <div className="text-xs text-gray-500">Price: {formatCurrencyIDR(b.course.price)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${b.bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : b.bookingStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          <div>Method: {b.paymentMethod}</div>
                          {b.paymentMethod === 'INSTALLMENT' && (
                            <div>Installments: {b.totalInstallments || 'N/A'}</div>
                          )}
                          <div>Overall Status: <span className="font-semibold">{overallPaymentStatus.replace('_', ' ')}</span></div>
                          {/* Tombol untuk melihat detail cicilan bisa ditambahkan di sini, membuka modal atau halaman lain */}
                        </td>
                        {/* <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                           Admin bisa update booking status di sini jika perlu
                           <button onClick={() => handleOpenUpdateBookingStatusModal(b)} className="text-indigo-600 hover:text-indigo-900">Manage</button>
                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ——— Payment Management ——— */}
        <section className="p-4 bg-white shadow rounded-lg">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 pb-4 border-b">All Payment Installments</h2>
          {loading && !payments.length ? <Spinner/> : payments.length === 0 ? (
            <p className="text-gray-500">No payment records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inst. No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((p) => ( // `p` adalah satu record cicilan
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{p.id.substring(0,8)}...</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 hover:underline cursor-pointer" onClick={() => {/* TODO: Buka detail booking */}}>
                        {p.bookingId.substring(0,8)}...
                      </td>
                       <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <div>{p.booking?.student?.name || 'N/A'}</div>
                        <div className="text-gray-500">{p.booking?.student?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{p.booking?.course?.title || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{p.installmentNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">{formatCurrencyIDR(p.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                        {p.dueDate ? format(parseISO(p.dueDate), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap w-56"> {/* Beri lebar agar form tidak terlalu sempit */}
                        <PaymentStatusForm
                          paymentId={p.id}
                          currentStatus={p.status}
                          onSubmit={handlePaymentStatusUpdate}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* User Form Modal */}
        {userFormMode && (
          <div className="modal-backdrop" onClick={handleCloseUserForm}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-lg font-semibold mb-4">
                {userFormMode === 'edit' ? 'Edit User' : 'Add New User'}
              </h2>
              <UserForm
                key={editingUser ? `edit-${editingUser.id}` : 'create-user'}
                initialData={editingUser}
                onSubmit={handleUserSubmit}
                onCancel={handleCloseUserForm}
                submitLabel={userFormMode === 'edit' ? 'Update User' : 'Create User'}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}