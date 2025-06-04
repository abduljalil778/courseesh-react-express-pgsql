import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyBookings from './pages/MyBookings';
import TeacherBookingRequests from './pages/TeacherBookingRequests';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Spinner from './components/Spinner';
import StudentBooking from './pages/StudentBooking';
import CourseDetail from './pages/CourseDetail';
import MyPayouts from './pages/MyPayouts';
import TeacherScheduleAndReports from './pages/TeacherScheduleAndReport';
import RegisterPage from './pages/RegisterPage';
import StudentCourseProgress from './pages/StudentCourseProgress';


function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={48} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

export default function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Navbar/>
          <Routes>
            <Route element={<Layout/>}/>
              <Route path="/login" element={<LoginPage />} />
              <Route path='register' element={<RegisterPage/>}/>


            {/* Admin-only */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/courses/:courseId"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <CourseDetail />
                </PrivateRoute>
              }
            />

            {/* Teacher-only */}
            <Route
              path="/teacher"
              element={
                <PrivateRoute roles={['TEACHER']}>
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path='/teacher/my-payouts'
              element={
                <PrivateRoute roles={['TEACHER']}>
                  <MyPayouts/>
                </PrivateRoute>
              }
            />
            <Route path="/teacher/bookings" element={
              <PrivateRoute roles={['TEACHER']}>
                <TeacherBookingRequests/>
              </PrivateRoute>}
            />
            <Route
              path='/teacher/schedules'
              element={
                <PrivateRoute roles={['TEACHER']}>
                  <TeacherScheduleAndReports/>
                </PrivateRoute>
              }
            />

            {/* Student-only */}
            <Route
              path="/student"
              element={
                <PrivateRoute roles={['STUDENT']}>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />

            {/* Student Course List */}
            <Route
            path='/student/my-courses'
            element={
              <PrivateRoute roles={['STUDENT']}>
                <StudentCourseProgress />
              </PrivateRoute>
            }
            />

            {/* Course Detail */}
            <Route
              path="/student/courses/:courseId"
              element={
                <PrivateRoute roles={['STUDENT']}>
                  <CourseDetail />
                </PrivateRoute>
              }
            />

            {/* Payment method */}
            {/* <Route path='student/payment/:bookingId' element={
              <PrivateRoute roles={['STUDENT']}>
                <Payment/>
              </PrivateRoute>
            }/> */}

            {/* Student Booking form */}
            <Route
              path="/student/book/:courseId"
              element={
                <PrivateRoute roles={['STUDENT']}>
                  <StudentBooking />
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            
            {/* my bookings */}
            <Route path="/student/my-bookings" element={
              <PrivateRoute roles={['STUDENT']}>
                <MyBookings/>
              </PrivateRoute>}/>

            
            
            
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
