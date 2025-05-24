import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyBookings from './pages/MyBookings';
import TeacherBookings from './pages/TeacherBookings';
import ErrorBoundary from './components/ErrorBoundary';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/Layout';
import Spinner from './components/Spinner';

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
              <Route path='/register' element={<RegisterPage/>}/>
              <Route path="/login" element={<LoginPage />} />


            {/* Admin-only */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={['ADMIN']}>
                  <AdminDashboard />
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

            {/* Student-only */}
            <Route
              path="/student"
              element={
                <PrivateRoute roles={['STUDENT']}>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
            
            {/* my bookings */}
            <Route path="/my-bookings" element={
              <PrivateRoute roles={['STUDENT']}>
                <MyBookings/>
              </PrivateRoute>}/>

            {/* Teacher bookings */}
            <Route path="/teacher/bookings" element={
              <PrivateRoute roles={['TEACHER']}>
                <TeacherBookings/>
              </PrivateRoute>}/>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
