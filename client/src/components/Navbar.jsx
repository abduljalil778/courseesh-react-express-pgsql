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
      <Link to="/my-bookings" className="mr-4">My Bookings</Link>
      )}

      {/* booking list for teacher */}
      {user.role === 'TEACHER' && (
      <Link to="/teacher/bookings" className="mr-4">My Bookings</Link>
      )}

      {/* {user.role === 'TEACHER' && (
      <Link to="/teacher/schedules" className="mr-4">My Schedule</Link>
      )} */}
      <button onClick={logout} className="text-red-600">Logout</button>

    </nav>
  );
}
