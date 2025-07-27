import React, {useState} from 'react';
import { NavLink, Link } from 'react-router-dom';
import { HomeIcon, UsersIcon, CreditCardIcon, BookOpenIcon, Cog8ToothIcon, CalendarIcon, BanknotesIcon, WalletIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

const navItems = [
 {
   label: 'GENERAL',
   items: [
    { name: 'Dashboard', to: '/teacher', icon: HomeIcon, end: true },
    { name: 'My Courses', to: '/teacher/courses', icon: UsersIcon },
    { name: 'My Bookings', to: '/teacher/bookings', icon: BookOpenIcon },
    { name: 'My Schedules', to: '/teacher/schedules', icon: CalendarIcon },
   ],
 },
 {
   label: 'FINANCE',
   items: [
    { name: 'Honorarium', to: '/teacher/payouts', icon: BanknotesIcon },
   ],
 },
 {
   label: 'SUPPORT',
   items: [
     { name: 'Settings', to: '/teacher/settings', icon: Cog8ToothIcon },
   ],
 },
];

export default function NewSidebar() {
  useAuth();
  const [isExpanded, setIsExpanded] = useState(true); 

  const activeClassName = "bg-primary/10 text-primary font-semibold";
  const baseClassName = "flex items-center px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors";

  return (
    <aside className={`bg-white border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
      {/* Header dengan tombol toggle */}
      <div className="flex items-center h-14 px-4 border-b border-gray-200">
        <Link to="/teacher" className={`flex items-center overflow-hidden transition-opacity duration-300 ${isExpanded ? "opacity-100" : "opacity-0 w-0"}`}>
            <img src="/logo.png" alt="Courseesh" className="h-8 w-auto mr-2" />
        </Link>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-full hover:bg-gray-100 ml-auto">
          {isExpanded ? <ChevronDoubleLeftIcon className="h-5 w-5" /> : <ChevronDoubleRightIcon className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigasi Utama */}
      <div className="flex-grow p-3 overflow-y-auto">
        {navItems.map((group, index) => (
          <div key={index} className="mb-4">
            <h3 className={`px-3 mb-2 text-xs font-semibold text-gray-400 uppercase transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{group.label}</h3>
            <nav className="space-y-1">
              {group.items.map(item => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `${baseClassName} ${isActive ? activeClassName : ''}`}
                  title={isExpanded ? '' : item.name}
                >
                  <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className={`transition-opacity duration-200 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
}