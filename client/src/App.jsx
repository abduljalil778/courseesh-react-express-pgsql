// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Tambahkan Outlet
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import MyBookings from './pages/MyBookings';
import TeacherBookingRequests from './pages/TeacherBookingRequests';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/Spinner';
import StudentBooking from './pages/StudentBooking';
import CourseDetail from './pages/CourseDetail';
import MyPayouts from './pages/MyPayouts';
import TeacherScheduleAndReports from './pages/TeacherScheduleAndReport';
import RegisterPage from './pages/RegisterPage';
import StudentCourseProgress from './pages/StudentCourseProgress';
import StudentBookingProgressDetail from './pages/StudentBookingProgressDetail';
import TeacherBookingManageDetail from './pages/TeacherBookingManageDetail';

// Layout untuk Halaman Terproteksi
function ProtectedLayout({ roles }) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <div className="container mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <Outlet /> 
        </div>
      </main>
    </div>
  );
}

// Layout untuk Halaman Publik (Login, Register)
function PublicLayout() {
    return (
        <div className="bg-gray-100 min-h-screen">
            <Outlet />
        </div>
    );
}


export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rute Publik (Login, Register) */}
            <Route element={<PublicLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path='/courses'/>
            </Route>

            {/* Rute Terproteksi untuk ADMIN */}
            <Route element={<ProtectedLayout roles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/courses/:courseId" element={<CourseDetail />} />
            </Route>

            {/* Rute Terproteksi untuk TEACHER */}
            <Route element={<ProtectedLayout roles={['TEACHER']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
              <Route path="/teacher/bookings" element={<TeacherBookingRequests />} />
              <Route path="/teacher/schedules" element={<TeacherScheduleAndReports />} />
              <Route path="/teacher/schedules/:bookingId" element={<TeacherBookingManageDetail />} />
              <Route path="/teacher/my-payouts" element={<MyPayouts />} />

            </Route>
            
            {/* Rute Terproteksi untuk STUDENT */}
            <Route element={<ProtectedLayout roles={['STUDENT']} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/my-courses" element={<StudentCourseProgress />} />
              <Route path="/student/my-courses/:bookingId" element={<StudentBookingProgressDetail />} />
              <Route path="/student/my-bookings" element={<MyBookings />} />
              <Route path="/student/book/:courseId" element={<StudentBooking />} />
              <Route path="/student/courses/:courseId" element={<CourseDetail />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// export default function App() {

//   return (
//     <ErrorBoundary>
//       <AuthProvider>
//         <BrowserRouter>
//           <Navbar/>
//           <Routes>
//             <Route element={<Layout/>}/>
//               <Route path="/login" element={<LoginPage />} />
//               <Route path='register' element={<RegisterPage/>}/>


//             {/* Admin-only */}
//             <Route
//               path="/admin"
//               element={
//                 <PrivateRoute roles={['ADMIN']}>
//                   <AdminDashboard />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/admin/courses/:courseId"
//               element={
//                 <PrivateRoute roles={['ADMIN']}>
//                   <CourseDetail />
//                 </PrivateRoute>
//               }
//             />

//             {/* Teacher-only */}
//             <Route
//               path="/teacher"
//               element={
//                 <PrivateRoute roles={['TEACHER']}>
//                   <TeacherDashboard />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path='/teacher/my-payouts'
//               element={
//                 <PrivateRoute roles={['TEACHER']}>
//                   <MyPayouts/>
//                 </PrivateRoute>
//               }
//             />
//             <Route path="/teacher/bookings" element={
//               <PrivateRoute roles={['TEACHER']}>
//                 <TeacherBookingRequests/>
//               </PrivateRoute>}
//             />
//             <Route
//               path='/teacher/schedules'
//               element={
//                 <PrivateRoute roles={['TEACHER']}>
//                   <TeacherScheduleAndReports/>
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path='/teacher/schedules/:bookingId'
//               element={
//                 <PrivateRoute roles={['TEACHER']}>
//                   <TeacherBookingManageDetail />
//                 </PrivateRoute>
//               }
//             />

//             {/* Student-only */}
//             <Route
//               path="/student"
//               element={
//                 <PrivateRoute roles={['STUDENT']}>
//                   <StudentDashboard />
//                 </PrivateRoute>
//               }
//             />

//             {/* Student Course List */}
//             <Route
//             path='/student/my-courses'
//             element={
//               <PrivateRoute roles={['STUDENT']}>
//                 <StudentCourseProgress />
//               </PrivateRoute>
//             }
//             />

//             {/* Course Detail */}
//             <Route
//               path="/student/courses/:courseId"
//               element={
//                 <PrivateRoute roles={['STUDENT']}>
//                   <CourseDetail />
//                 </PrivateRoute>
//               }
//             />

//             {/* Schedule course detail */}
//             <Route
//               path='/student/my-courses/:bookingId'
//               element={
//                 <PrivateRoute roles={['STUDENT']}>
//                   <StudentBookingProgressDetail />
//                 </PrivateRoute>
//               }
//             />

//             {/* Student Booking form */}
//             <Route
//               path="/student/book/:courseId"
//               element={
//                 <PrivateRoute roles={['STUDENT']}>
//                   <StudentBooking />
//                 </PrivateRoute>
//               }
//             />

//             {/* Fallback */}
//             <Route path="*" element={<Navigate to="/login" replace />} />
            
//             {/* my bookings */}
//             <Route path="/student/my-bookings" element={
//               <PrivateRoute roles={['STUDENT']}>
//                 <MyBookings/>
//               </PrivateRoute>}/>

            
            
            
//           </Routes>
//         </BrowserRouter>
//       </AuthProvider>
//     </ErrorBoundary>
//   );
// }
