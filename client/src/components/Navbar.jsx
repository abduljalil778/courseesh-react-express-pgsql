import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  if (loading) return null;     // still checking localStorage
  if (!user)  return null;      // don’t render at all unless logged in

  return (
    <nav className="p-4 bg-gray-100 flex justify-between">
      <Link to={`/${user.role.toLowerCase()}`}>Dashboard</Link>

      {/* booking list fir student */}
      {user.role === 'STUDENT' && (
      <Link to="/student/my-bookings" className="mr-4">My Bookings</Link>
      )}

      {/* course student list */}
      {user.role === 'STUDENT' && (
      <Link to="/student/my-courses" className="mr-4">My Courses</Link>
      )}

      {/* course progress for student */}

      {/* booking list for teacher */}
      {user.role === 'TEACHER' && (
      <Link to="/teacher/bookings" className="mr-4">Bookings Requests</Link>
      )}

      {/* schedule & report */}
      {user.role === 'TEACHER' && (
      <Link to="/teacher/schedules" className="mr-4">Schedule & Report</Link>
      )}

      {/* payout page for teacher */}
      {user.role === 'TEACHER' && (
        <Link to="/teacher/my-payouts" className="mr-4">My Payouts</Link>
      )}

      <button onClick={logout} className="text-red-600">Logout</button>

    </nav>
  );
}
