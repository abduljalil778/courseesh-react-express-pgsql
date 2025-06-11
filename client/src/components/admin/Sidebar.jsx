// src/components/admin/Sidebar.jsx
import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, Users, Book, CalendarCheck, CreditCard,
  Banknote, Settings, LifeBuoy, Bell, LogOut, ChevronsLeft, ChevronsRight
} from 'lucide-react';

const mainLinks = [
  { name: 'Dashboard', to: '/admin', icon: LayoutDashboard, end: true },
  { name: 'Users', to: '/admin/users', icon: Users },
  { name: 'Courses', to: '/admin/courses', icon: Book },
  { name: 'Bookings', to: '/admin/bookings', icon: CalendarCheck },
  { name: 'Payments', to: '/admin/payments', icon: CreditCard },
  { name: 'Payouts', to: '/admin/payouts', icon: Banknote },
  { name: 'Payment Options', to: '/admin/payment-options', icon: Settings },
];

const secondaryLinks = [
  { name: 'Support', to: '/admin/support', icon: LifeBuoy },
  { name: 'Notifications', to: '/admin/notifications', icon: Bell },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const activeClassName = "bg-indigo-700 text-white";
  const baseClassName = "flex items-center px-3 py-2.5 rounded-md text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors";

  return (
    <aside className={`flex flex-col bg-gray-800 text-gray-300 transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
      {/* Header Sidebar dengan Logo dan Tombol Toggle */}
      <div className="h-16 flex items-center justify-between border-b border-gray-700 px-4">
        <Link to="/admin" className={`flex items-center overflow-hidden transition-all ${isExpanded ? "w-32" : "w-0"}`}>
          <img src="/logo.png" alt="Courseesh" className="h-8 w-auto flex-shrink-0" />
        </Link>
        <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-md hover:bg-gray-700">
          {isExpanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
        </button>
      </div>

      {/* Navigasi */}
      <nav className="flex-grow p-2 space-y-1">
        {mainLinks.map(link => (
          <NavLink
            key={link.name}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `${baseClassName} ${isActive ? activeClassName : ''}`}
            title={link.name}
          >
            <link.icon size={20} className="flex-shrink-0" />
            <span className={`ml-3 overflow-hidden transition-all ${isExpanded ? 'w-full' : 'w-0'}`}>{link.name}</span>
          </NavLink>
        ))}
        
        <hr className="my-4 border-t border-gray-700"/>

        {secondaryLinks.map(link => (
           <NavLink
            key={link.name}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `${baseClassName} ${isActive ? activeClassName : ''}`}
            title={link.name}
          >
            <link.icon size={20} className="flex-shrink-0" />
            <span className={`ml-3 overflow-hidden transition-all ${isExpanded ? 'w-full' : 'w-0'}`}>{link.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Sidebar dengan Info User dan Logout */}
      <div className="p-2 border-t border-gray-700">
        <div className={`p-2 rounded-md flex items-center transition-colors ${isExpanded ? 'hover:bg-gray-700' : ''}`}>
           <div className="h-10 w-10 rounded-full bg-indigo-200 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">
               {user.name.charAt(0)}
           </div>
           <div className={`ml-3 overflow-hidden transition-all ${isExpanded ? 'w-full' : 'w-0'}`}>
              <p className="text-sm font-semibold text-white whitespace-nowrap">{user.name}</p>
              <p className="text-xs text-gray-400 whitespace-nowrap">{user.role}</p>
           </div>
        </div>
        <button
          onClick={logout}
          className={`${baseClassName} w-full mt-2 text-red-400 hover:bg-red-500 hover:text-white`}
          title="Logout"
        >
          <LogOut size={20} className="flex-shrink-0"/>
          <span className={`ml-3 overflow-hidden transition-all ${isExpanded ? 'w-full' : 'w-0'}`}>Logout</span>
        </button>
      </div>
    </aside>
  );
}