// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/Spinner';

// Layouts
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/admin/AdminLayout';
import MainLayout from './components/MainLayout';

// Halaman Publik
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserProfilePage from './pages/UserProfilePage';

// Halaman Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagementPage from './pages/admin/UserManagementPage';
import CourseManagementPage from './pages/admin/CourseManagementPage';
import BookingManagementPage from './pages/admin/BookingManagementPage';
import PaymentManagementPage from './pages/admin/PaymentManagementPage';
import PayoutManagementPage from './pages/admin/PayoutManagementPage';
import PaymentOptionsPage from './pages/admin/PaymentOptionsPage';
import ApplicationSettingsPage from './pages/ApplicationSettingsPage';
import UserSettings from '@/pages/UserSettings';

// Halaman Teacher
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherBookingRequests from './pages/TeacherBookingRequests';
import TeacherScheduleDetails from './pages/TeacherScheduleDetails';
import MyPayouts from './pages/MyPayouts';
import TeacherSchedules from './pages/TeacherSchedules';
import TeacherAvailability from './components/TeacherAvailability';

// Halaman Student
import StudentDashboard from './pages/StudentDashboard';
import MyCoursesList from './pages/MyCoursesList';
import MyCourseProgress from './pages/MyCourseProgress';
import MyBookings from './pages/MyBookings';
import CourseDetail from './pages/CourseDetail';
import PaymentPage from './pages/PaymentPage';
import Checkout from './pages/Checkout';
import TeacherProfilePage from './pages/TeacherProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import ChatPage from './pages/ChatPage';




function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size={60} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  return children;
}


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* --- Rute Publik --- */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/teachers/:teacherId" element={<TeacherProfilePage />} />
              
            </Route>
            

            {/* --- Rute Admin --- */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="notifications" element={<NotificationsPage/>}/>
              <Route path="users" element={<UserManagementPage />} />
              <Route path="courses" element={<CourseManagementPage />} />
              <Route path="bookings" element={<BookingManagementPage />} />
              <Route path="payments" element={<PaymentManagementPage />} />
              <Route path="payouts" element={<PayoutManagementPage />} />
              <Route path="payment-options" element={<PaymentOptionsPage />} />
              <Route path='settings' element={<UserSettings />} />
              <Route path="profile" element={<UserProfilePage />} />
              
            </Route>

            {/* --- Rute Teacher --- */}
            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute roles={['TEACHER']}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<TeacherDashboard />} />
              <Route path="notifications" element={<NotificationsPage/>}/>
              <Route path="bookings" element={<TeacherBookingRequests />} />
              <Route path="schedules" element={<TeacherSchedules />} />
              <Route path="schedules/:bookingId" element={<TeacherScheduleDetails />} />
              <Route path="availability" element={<TeacherAvailability />} />
              <Route path="my-payouts" element={<MyPayouts />} />
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="settings" element={<UserSettings />} />
              <Route path="chat/:bookingId" element={<ChatPage />} />
            </Route>
            
            {/* --- Rute Student --- */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute roles={['STUDENT']}>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path='notifications' element={<NotificationsPage/>}/>
              <Route path="my-courses" element={<MyCoursesList />} />
              <Route path="my-courses/:bookingId" element={<MyCourseProgress />} />
              <Route path="my-bookings" element={<MyBookings />} />
              <Route path="courses/:courseId" element={<CourseDetail />} />
              <Route path="cart/checkout/:courseId" element={<Checkout />} />
              <Route path="bookings/:bookingId/pay" element={<PaymentPage />} />
              <Route path="profile" element={<UserProfilePage />} />
              <Route path="chat/:bookingId" element={<ChatPage />} />
            </Route>

            {/* --- Fallback dan Redirect --- */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}