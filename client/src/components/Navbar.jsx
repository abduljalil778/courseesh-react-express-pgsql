// src/components/Navbar.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, UserCircle, Menu, X, Search, Filter, Bell, Settings, LucideCreditCard } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem,
  NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { useCourseFilterStore } from '@/stores/courseFilterStore';
import { CLASS_LEVELS, SUBJECT_CATEGORIES } from '@/config'; 
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

// Komponen kecil untuk daftar link di menu navigasi kanan
const RightNavLinks = ({ role }) => {
  const commonProps = {
    className: "text-sm font-medium text-muted-foreground transition-colors hover:text-primary",
  };
  if (role === 'STUDENT') {
    return (
      <nav className="hidden lg:flex gap-6">
        <Link to="/student/my-courses" {...commonProps}>My Courses</Link>
        <Link to="/student/my-bookings" {...commonProps}>Transactions</Link>
      </nav>
    );
  }
  if (role === 'TEACHER') {
    return (
      <nav className="hidden lg:flex gap-6">
        <Link to="/teacher/bookings" {...commonProps}>Bookings</Link>
        <Link to="/teacher/schedules" {...commonProps}>Schedules</Link>
      </nav>
    );
  }
  return null;
};

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Ambil state dan setter dari store
  const { searchTerm, setSearchTerm, filterClass, setFilterClass, setCategory } = useCourseFilterStore();

  const isDashboard = location.pathname.includes('/student') || location.pathname.includes('/teacher');

  if (loading || !user || user.role === 'ADMIN' || !isDashboard) return null;

  const avatarSrc = user.avatarUrl
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${user.name.replace(/\s/g, '+')}&background=random`;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16 gap-4 md:gap-8">
          
          {/* === BAGIAN KIRI: LOGO & KATEGORI === */}
          <div className="flex items-start gap-6">
            <Link to={`/${user.role.toLowerCase()}`} className="flex-shrink-0">
              <img className="h-9 w-auto" src="/logo.png" alt="Courseesh Logo" />
            </Link>

            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Explore</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {SUBJECT_CATEGORIES.map((cat) => (
                        <li key={cat.value}>
                          <NavigationMenuLink asChild>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCategory(cat.value);
                                // Arahkan ke halaman dashboard utama untuk melihat hasil filter
                                navigate(`/${user.role.toLowerCase()}`);
                              }}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">{cat.label}</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {cat.description || `Jelajahi kursus terbaik di bidang ${cat.label}.`}
                              </p>
                            </a>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* === BAGIAN TENGAH: SEARCH & FILTER === */}
          <div className="flex-grow flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search courses"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md pl-9 text-sm"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center shrink-0">
                  <Filter className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{filterClass || "All Classes"}</span>
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

          {/* === BAGIAN KANAN: NAVIGASI, NOTIFIKASI, USER MENU === */}
          <div className="flex items-center gap-2">
            <RightNavLinks role={user.role} />
            
            {user.role === 'STUDENT' && (
              <div className="flex items-center">
              <Button variant="ghost" size="icon" className="relative" title="Notifications">
                <ShoppingCartIcon className="h-5 w-5 text-gray-500 hover:text-gray-900" />
              </Button>
            </div>
            )}

            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="relative" title="Notifications">
                <Bell className="h-5 w-5 text-gray-500 hover:text-gray-900" />
              </Button>
            </div>
            
            {/* User Menu Dropdown (tidak berubah) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarSrc} alt={user.name} />
                    <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
                <DropdownMenuItem asChild><Link to={`/${user.role.toLowerCase()}/profile`} className="cursor-pointer w-full"><UserCircle className="mr-2 h-4 w-4" /><span>Profile</span></Link></DropdownMenuItem>
                {user.role === 'TEACHER' && <DropdownMenuItem asChild><Link to="/teacher/settings" className="cursor-pointer w-full"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></Link></DropdownMenuItem>}
                {user.role === 'TEACHER' && <DropdownMenuItem asChild><Link to="/teacher/my-payouts" className="cursor-pointer w-full"><LucideCreditCard className="mr-2 h-4 w-4" /><span>Honor</span></Link></DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" /><span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
    </header>
  );
}