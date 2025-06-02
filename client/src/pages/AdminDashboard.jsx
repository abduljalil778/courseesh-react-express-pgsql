// src/pages/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  getAllUsers, createUser, updateUser, deleteUser,
  getAllCourses,
  getAllBookings,
  getAllPayments, // Ini adalah semua record cicilan individual
  updatePayment,  // Ini untuk update status per cicilan
  getAllTeacherPayoutsAdmin,
  updateTeacherPayoutAdmin,
} from '../lib/api';
import Spinner from '../components/Spinner';
import Swal from 'sweetalert2';
import UserForm from '../components/UserForm';
import PaymentStatusForm from '../components/PaymentStatusForm';
import PayoutUpdateForm from '../components/PayoutUpdateForm';
import { format, parseISO } from 'date-fns';
import { formatCurrencyIDR } from '../utils/formatCurrency';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]); // Daftar semua cicilan individual
  const [teacherPayouts, setTeacherPayouts] = useState([]);

  const [loadingData, setLoadingData] = useState({
    users: true, courses: true, bookings: true, payments: true, teacherPayouts: true,
  });
  const [error, setError] = useState({}); // Inisialisasi sebagai objek kosong

  const [editingUser, setEditingUser] = useState(null);
  const [userFormMode, setUserFormMode] = useState(null);

  const [selectedPayout, setSelectedPayout] = useState(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const loadAllData = useCallback(async () => {
    setLoadingData({ users: true, courses: true, bookings: true, payments: true, teacherPayouts: true });
    setError({}); // Reset ke objek kosong
    try {
      const [usersRes, coursesRes, bookingsRes, paymentsRes, teacherPayoutsRes] = await Promise.allSettled([
        getAllUsers(),
        getAllCourses(),
        getAllBookings(), // Backend harus include booking.payments, booking.student, booking.course.teacher
        getAllPayments(), // Backend harus include payment.booking.student, payment.booking.course
        getAllTeacherPayoutsAdmin(), // Backend harus include payout.teacher, payout.booking.course, payout.booking.student
      ]);

      const processResponse = (response, setter, entityName) => {
        if (response.status === 'fulfilled') {
          setter(response.value.data || []);
        } else {
          console.error(`Failed to load ${entityName}:`, response.reason);
          setError(prevError => ({
            ...prevError,
            [entityName]: response.reason.response?.data?.message || `Could not load ${entityName}`,
          }));
          setter([]);
        }
      };

      processResponse(usersRes, setUsers, 'users');
      processResponse(coursesRes, setCourses, 'courses');
      processResponse(bookingsRes, setBookings, 'bookings');
      processResponse(paymentsRes, setPayments, 'payments');
      processResponse(teacherPayoutsRes, setTeacherPayouts, 'teacherPayouts');

    } catch (err) { // Seharusnya tidak mudah terpicu karena Promise.allSettled
      console.error('Unexpected error in loadAllData wrapper:', err);
      setError(prevError => ({ ...prevError, global: 'An unexpected error occurred while loading data.' }));
    } finally {
      setLoadingData({ users: false, courses: false, bookings: false, payments: false, teacherPayouts: false });
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // --- User Management Handlers ---
  const handleOpenCreateUserForm = () => { setEditingUser(null); setUserFormMode('create'); };
  const handleOpenEditUserForm = (user) => { setEditingUser(user); setUserFormMode('edit'); };
  const handleCloseUserForm = () => { setUserFormMode(null); setEditingUser(null); };
  const handleUserSubmit = async (userData) => {
    const isUpdating = userFormMode === 'edit';
    Swal.fire({ title: `${isUpdating ? 'Updating' : 'Creating'} user...`, allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      if (isUpdating && editingUser) {
        await updateUser(editingUser.id, userData);
      } else {
        await createUser(userData);
      }
      await loadAllData();
      handleCloseUserForm();
      Swal.fire('Success!', `User ${isUpdating ? 'updated' : 'created'} successfully.`, 'success');
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || `Could not ${isUpdating ? 'update' : 'create'} user.`, 'error');
    }
  };
  const handleUserDelete = async (userId) => {
    const result = await Swal.fire({ title: 'Are you sure?', text: "This user will be permanently deleted!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6', confirmButtonText: 'Yes, delete it!' });
    if (result.isConfirmed) {
      try {
        await deleteUser(userId);
        if (editingUser?.id === userId) handleCloseUserForm();
        await loadAllData();
        Swal.fire('Deleted!', 'User has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error!', err.response?.data?.message || 'Could not delete user.', 'error');
      }
    }
  };

  // --- Payment (Installment) Status Update Handler ---
  const handlePaymentStatusUpdate = async (paymentId, newStatus) => {
    try {
      await updatePayment(paymentId, { status: newStatus });
      // Optimistic UI update
      setPayments(prevPayments => prevPayments.map(p => p.id === paymentId ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p));
      setBookings(prevBookings =>
        prevBookings.map(b => ({
          ...b,
          payments: b.payments?.map(p => p.id === paymentId ? { ...p, status: newStatus, updatedAt: new Date().toISOString() } : p),
        }))
      );
      // Jika status booking bergantung pada status pembayaran, update juga di sini atau panggil loadBookings
      Swal.fire('Success!', 'Payment installment status updated.', 'success');
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || 'Could not update payment installment status.', 'error');
      loadAllData(); // Re-fetch data jika ada error untuk sinkronisasi
    }
  };

  // --- Teacher Payout Management Handlers ---
  const openPayoutModal = (payout) => { setSelectedPayout(payout); setIsPayoutModalOpen(true); };
  const closePayoutModal = () => { setSelectedPayout(null); setIsPayoutModalOpen(false); };
  const handlePayoutUpdateSubmit = async (payoutId, data) => {
    setIsSubmittingPayout(true);
    try {
      const response = await updateTeacherPayoutAdmin(payoutId, data);
      Swal.fire('Success!', 'Teacher payout status updated.', 'success');
      closePayoutModal();
      setTeacherPayouts(prevPayouts => prevPayouts.map(p => p.id === payoutId ? response.data : p)); // Update dengan data dari server
      // Juga update data `teacherPayout` yang mungkin ada di dalam state `bookings`
        setBookings(prevBookings => 
            prevBookings.map(b => b.id === response.data.bookingId 
                ? { ...b, teacherPayout: response.data } 
                : b
            )
        );
    } catch (err) {
      Swal.fire('Error!', err.response?.data?.message || 'Could not update teacher payout.', 'error');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // --- Helper Functions for UI ---
  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-sky-100 text-sky-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getPayoutStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'FAILED': case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING_CALCULATION': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getOverallPaymentStatusForBooking = (booking) => {
    if (!booking.payments || booking.payments.length === 0) {
      return { text: 'NO_PAYMENTS', colorClass: 'bg-gray-100 text-gray-800' };
    }
    const allPaid = booking.payments.every(p => p.status === 'PAID');
    if (allPaid) return { text: 'FULLY PAID', colorClass: 'bg-green-100 text-green-800' };
    const somePaid = booking.payments.some(p => p.status === 'PAID');
    if (somePaid) return { text: 'PARTIALLY PAID', colorClass: 'bg-yellow-100 text-yellow-800' };
    if (booking.payments.some(p => p.status === 'FAILED')) return { text: 'HAS FAILED', colorClass: 'bg-red-100 text-red-800' };
    return { text: 'PENDING', colorClass: 'bg-orange-100 text-orange-800' };
  };

  // --- Tampilan Loading dan Error Global ---
  const isAnyDataStillLoading = Object.values(loadingData).some(status => status);
  const hasAnyErrorOccurred = Object.values(error).some(e => !!e);
  const noInitialDataLoaded = !users.length && !courses.length && !bookings.length && !payments.length && !teacherPayouts.length;

  if (isAnyDataStillLoading && noInitialDataLoaded && !hasAnyErrorOccurred) {
    return <div className="flex items-center justify-center h-screen"><Spinner size={64} /></div>;
  }
  if (hasAnyErrorOccurred && noInitialDataLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
        <p className="text-2xl text-red-600 mb-4">Oops! Data Loading Failed.</p>
        {Object.entries(error).map(([key, val]) => val ? <p key={key} className="text-gray-700 mb-1">{key.charAt(0).toUpperCase() + key.slice(1)} Error: {val}</p> : null)}
        <button onClick={loadAllData} className="mt-6 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Retry All Data</button>
      </div>
    );
  }

  return (
    <>
      {/* <style>{modalStyles}</style> Jika CSS modal belum global */}
      <div className="p-4 md:p-6 lg:p-8 space-y-10">
        {hasAnyErrorOccurred && !noInitialDataLoaded && (
          <div className="p-4 my-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded-md shadow">
            <p className="font-semibold">An error occurred while loading some data sections:</p>
            {Object.entries(error).map(([key, val]) => val ? <p key={key} >- {key.charAt(0).toUpperCase() + key.slice(1)}: {val}</p> : null)}
            <button onClick={loadAllData} className="mt-2 font-semibold text-blue-600 underline hover:text-blue-800">Reload All Data</button>
          </div>
        )}

        {/* --- User Management --- */}
        <section className="p-4 bg-white shadow-lg rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">User Management</h2>
            <button onClick={handleOpenCreateUserForm} className="mt-3 sm:mt-0 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Add New User
            </button>
          </div>
          {loadingData.users ? <div className="text-center py-4"><Spinner/></div> : users.length === 0 ? (<p className="text-gray-500 py-4 text-center">No users found.</p>) : (
            <ul className="space-y-3">
              {users.map((u) => (
                <li key={u.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border border-gray-200 rounded-md hover:shadow-lg transition-shadow">
                  <div className="mb-2 sm:mb-0">
                    <p className="font-semibold text-gray-700">{u.name} <span className="text-sm text-gray-500">({u.email})</span></p>
                    <p className="text-xs text-gray-500">Phone: {u.phone || '-'}</p>
                    <p className="text-xs text-gray-500">
                      Role: <span className="font-medium text-indigo-600">{u.role}</span> | Status: <span className={`font-medium ${u.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>{u.status.toLowerCase()}</span>
                    </p>
                  </div>
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={() => handleOpenEditUserForm(u)} className="px-3 py-1 text-xs text-white bg-yellow-500 rounded-md hover:bg-yellow-600">Edit</button>
                    <button onClick={() => handleUserDelete(u.id)} className="px-3 py-1 text-xs text-white bg-red-600 rounded-md hover:bg-red-700">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Course Overview --- */}
        <section className="p-4 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">Course Overview</h2>
          {loadingData.courses ? <div className="text-center py-4"><Spinner/></div> : courses.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No courses found.</p>
          ) : (
            <ul className="space-y-3">
              {courses.map((c) => (
                <li key={c.id} className="p-3 border border-gray-200 rounded-md">
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
        
        {/* --- Bookings Overview --- */}
        <section className="p-4 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">Bookings Overview</h2>
          {loadingData.bookings ? <div className="text-center py-4"><Spinner/></div> : bookings.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No bookings have been made yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student & Course</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking & Payment Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Payout</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((b) => {
                    const associatedPayout = teacherPayouts.find(tp => tp.bookingId === b.id);
                    const paymentStatusInfo = getOverallPaymentStatusForBooking(b);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{b.student?.name || 'N/A'}</div>
                          <div className="text-xs text-gray-500">{b.student?.email || 'N/A'}</div>
                          <div className="mt-1 text-sm text-indigo-600 font-medium">{b.course?.title || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="mb-1">Booking: 
                            <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getBookingStatusColor(b.bookingStatus)}`}>
                              {b.bookingStatus}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">Pay Method: {b.paymentMethod}</div>
                          {b.paymentMethod === 'INSTALLMENT' && <div className="text-xs text-gray-500">Total Inst: {b.totalInstallments || 'N/A'}</div>}
                           <div className="text-xs text-gray-500 mt-0.5">Overall Pay: 
                            <span className={`ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatusInfo.colorClass}`}>
                                {paymentStatusInfo.text.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs">
                          {associatedPayout ? (
                            <>
                              <div>Status: <span className={`font-semibold px-2 py-0.5 inline-flex text-xs rounded-full ${getPayoutStatusColor(associatedPayout.status)}`}>{associatedPayout.status.replace(/_/g, ' ')}</span></div>
                              <div>Amount: {formatCurrencyIDR(associatedPayout.honorariumAmount)}</div>
                              {associatedPayout.payoutDate && <div>Paid: {format(parseISO(associatedPayout.payoutDate), 'dd MMM yyyy')}</div>}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">Not Generated</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* --- Teacher Payout Management --- */}
        <section className="p-4 bg-white shadow-lg rounded-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">Teacher Payouts</h2>
           {loadingData.teacherPayouts ? <div className="text-center py-4"><Spinner/></div> : teacherPayouts.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No teacher payouts generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course (Booking)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Honorarium</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payout Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teacherPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500" title={payout.id}>{payout.id.substring(0,8)}...</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payout.teacher?.name || 'N/A'}</div>
                        <div className="text-xs text-gray-500">{payout.teacher?.email || 'N/A'}</div>
                      </td>
                       <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{payout.booking?.course?.title || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Booking: <span className="text-blue-600 hover:underline cursor-pointer" title={payout.bookingId} onClick={() => {/* TODO: Navigasi/modal ke detail booking */}}>{payout.bookingId?.substring(0,8)}...</span></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrencyIDR(payout.honorariumAmount)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPayoutStatusColor(payout.status)}`}>
                          {payout.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        {payout.payoutDate ? format(parseISO(payout.payoutDate), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPayoutModal(payout)}
                          className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                          disabled={payout.status === 'PAID' || payout.status === 'CANCELLED'}
                        >
                          Manage Payout
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* --- Payment Management (Daftar Semua Cicilan Individual) --- */}
        <section className="p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-4 pb-4 border-b border-gray-200">All Payment Installments</h2>
            {loadingData.payments ? <div className="text-center py-4"><Spinner/></div> : payments.length === 0 ? (
            <p className="text-gray-500 py-4 text-center">No payment records found.</p>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking (Course)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inst. No.</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Update Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500" title={p.id}>{p.id.substring(0,8)}...</td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs">
                        <div className="text-gray-700">{p.booking?.course?.title || 'N/A'}</div>
                        <div className="text-blue-600 hover:underline cursor-pointer" title={p.bookingId} onClick={() => {/* TODO: Navigasi/modal ke detail booking */}}>{p.bookingId?.substring(0,8)}...</div>
                      </td>
                       <td className="px-4 py-4 whitespace-nowrap text-xs">
                        <div>{p.booking?.student?.name || 'N/A'}</div>
                        <div className="text-gray-500">{p.booking?.student?.email || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-center text-gray-700">{p.installmentNumber}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-700">{formatCurrencyIDR(p.amount)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                        {p.dueDate ? format(parseISO(p.dueDate), 'dd MMM yyyy') : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap w-56">
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
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-lg font-semibold text-gray-800">
                    {userFormMode === 'edit' ? 'Edit User' : 'Add New User'}
                </h2>
                <button onClick={handleCloseUserForm} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <UserForm
                key={editingUser ? `user-form-edit-${editingUser.id}` : 'user-form-create'}
                initialData={editingUser}
                onSubmit={handleUserSubmit}
                onCancel={handleCloseUserForm}
                submitLabel={userFormMode === 'edit' ? 'Update User' : 'Create User'}
              />
            </div>
          </div>
        )}

        {/* Modal untuk Update Teacher Payout */}
        {isPayoutModalOpen && selectedPayout && (
          <div className="modal-backdrop" onClick={closePayoutModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4 pb-2 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Update Payout Status</h2>
                <button onClick={closePayoutModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <PayoutUpdateForm
                payout={selectedPayout}
                onSubmit={handlePayoutUpdateSubmit}
                onCancel={closePayoutModal}
                isSubmitting={isSubmittingPayout}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}