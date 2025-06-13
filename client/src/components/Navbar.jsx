// src/components/Navbar.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LifeBuoy, LogOut, UserCircle, Menu, X, Search, Filter,
  Heart, Bell, ShoppingCart
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useCourseFilterStore } from '@/stores/courseFilterStore';
import { CLASS_LEVELS } from '@/config';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { searchTerm, setSearchTerm, filterClass, setFilterClass } = useCourseFilterStore();

  if (loading || !user || user.role === 'ADMIN') return null;

  const avatarSrc = user.avatarUrl
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const activeLinkStyle = {
    color: '#4f46e5',
    fontWeight: '600',
    borderColor: '#4f46e5',
  };
  const baseLinkStyle = "text-gray-500 hover:text-gray-900 border-b-2 border-transparent";
  
  const isStudentDashboard = location.pathname === '/student' || location.pathname === '/student/';

  const navLinks = (
    <>
      <NavLink to={`/${user.role.toLowerCase()}`} className={({ isActive }) => `${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} block md:inline-block px-3 py-2 rounded-md text-base font-medium md:text-sm`} onClick={() => setIsMobileMenuOpen(false)} end>
        Dashboard
      </NavLink>
      {user.role === 'STUDENT' && (
        <>
          <NavLink to="/student/my-courses" className={({ isActive }) => `${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} block md:inline-block px-3 py-2 rounded-md text-base font-medium md:text-sm`} onClick={() => setIsMobileMenuOpen(false)}>My Courses</NavLink>
          <NavLink to="/student/my-bookings" className={({ isActive }) => `${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} block md:inline-block px-3 py-2 rounded-md text-base font-medium md:text-sm`} onClick={() => setIsMobileMenuOpen(false)}>My Bookings</NavLink>
        </>
      )}
      {user.role === 'TEACHER' && (
        <>
          <NavLink to="/teacher/bookings" className={({ isActive }) => `${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} block md:inline-block px-3 py-2 rounded-md text-base font-medium md:text-sm`} onClick={() => setIsMobileMenuOpen(false)}>Booking Requests</NavLink>
          <NavLink to="/teacher/schedules" className={({ isActive }) => `${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} block md:inline-block px-3 py-2 rounded-md text-base font-medium md:text-sm`} onClick={() => setIsMobileMenuOpen(false)}>Schedules</NavLink>
          <NavLink to="/teacher/my-payouts" className={({ isActive }) => `${isActive ? 'text-indigo-600 font-semibold' : 'text-gray-600 hover:text-gray-900'} block md:inline-block px-3 py-2 rounded-md text-base font-medium md:text-sm`} onClick={() => setIsMobileMenuOpen(false)}>My Payouts</NavLink>
        </>
      )}
    </>
  );

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          <div className="flex items-center">
            <Link to={`/${user.role.toLowerCase()}`} className="flex-shrink-0">
              <img className="h-9 w-auto" src="/logo.png" alt="Courseesh Logo" />
            </Link>
            <nav className="hidden md:flex md:ml-6 md:space-x-4">
              {navLinks}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {isStudentDashboard && (
              <div className="hidden lg:flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:w-56 rounded-md pl-9 text-sm" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      <span>{filterClass || "All Classes"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Filter by Class Level</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={filterClass} onValueChange={setFilterClass}>
                      <DropdownMenuRadioItem value="">All Classes</DropdownMenuRadioItem>
                      {CLASS_LEVELS.map(level => (
                        <DropdownMenuRadioItem key={level} value={level}>{level}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
            
            <div className="hidden sm:flex items-center space-x-1">
              {user.role === 'STUDENT' && (
                <>
                  <Button variant="ghost" size="icon" title="Analytics">
                    <ShoppingCart className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Favorites">
                    <Heart className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="relative" title="Notifications">
                <Bell className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to={`/${user.role.toLowerCase()}/profile`} className="cursor-pointer"><UserCircle className="mr-2 h-4 w-4" /><span>Profile</span></Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tombol Hamburger (Mobile) */}
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:bg-gray-100">
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            {/* ... (Isi menu mobile tetap sama) ... */}
          </div>
        </div>
      )}
    </header>
  );
}