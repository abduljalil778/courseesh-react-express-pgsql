// src/components/Navbar.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return null;
  if (!user) return null;

  const activeLinkStyle = {
    color: '#4f46e5', // warna indigo-600
    fontWeight: '600',
  };

  const navLinks = (
    <>
      <NavLink to={`/${user.role.toLowerCase()}`} className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)} end>
        Dashboard
      </NavLink>
      {user.role === 'STUDENT' && (
        <>
          <NavLink to="/student/my-courses" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>
            My Courses
          </NavLink>
          <NavLink to="/student/my-bookings" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>
            My Bookings
          </NavLink>
        </>
      )}
      {user.role === 'TEACHER' && (
        <>
          <NavLink to="/teacher/bookings" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>Booking Requests</NavLink>
          <NavLink to="/teacher/schedules" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>Schedules</NavLink>
          <NavLink to="/teacher/my-payouts" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium" style={({ isActive }) => isActive ? activeLinkStyle : undefined} onClick={() => setIsMobileMenuOpen(false)}>My Payouts</NavLink>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to={`/${user.role.toLowerCase()}`}>
                <img className="h-10 w-auto" src="/logo.png" alt="Courseesh Logo" />
              </Link>
            </div>
            {/* Navigasi Desktop - Tampil di layar md ke atas */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinks}
              </div>
            </div>
          </div>
          {/* Info User dan Logout (Desktop) */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <span className="text-gray-700 text-sm mr-4">
                Welcome, <span className="font-bold">{user.name}</span>!
              </span>
              <button onClick={logout} className="px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                Logout
              </button>
            </div>
          </div>
          {/* Tombol Hamburger (Mobile) */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-800 hover:bg-gray-100 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navLinks}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center px-5">
            <div className="flex-shrink-0">
               <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {user.name.charAt(0)}
                </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">{user.name}</div>
              <div className="text-sm font-medium text-gray-500">{user.email}</div>
            </div>
          </div>
          <div className="mt-3 px-2 space-y-1">
            <button onClick={() => { logout(); setIsMobileMenuOpen(false); }}
              className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-white hover:bg-indigo-500">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}