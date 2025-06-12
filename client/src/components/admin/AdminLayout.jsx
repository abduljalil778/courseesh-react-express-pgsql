import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import NewSidebar from './NewSidebar';
import { Search, Plus, Bell, User, ChevronDown, Settings as IconSettings, LogOut as IconLogout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminLayout() {
 const location = useLocation();
 const navigate = useNavigate();
 const { user, logout } = useAuth();

 const getPageTitle = (pathname) => {
   const parts = pathname.split('/').filter(p => p);
   const title = (parts.length > 0 ? parts.slice(-1)[0] : 'Dashboard').replace(/-/g, ' ');
   return title.charAt(0).toUpperCase() + title.slice(1);
 };

 const pageTitle = getPageTitle(location.pathname);

 const handleLogout = () => {
   logout();
   navigate('/login');
 };

 return (
   <div className="flex h-screen bg-gray-100">
     <NewSidebar />
     <div className="flex-grow flex flex-col">
       <header className="bg-white shadow-sm h-14 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
         <div className="flex items-center">
           <button className="lg:hidden mr-2">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
             </svg>
           </button>
           <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
         </div>
         <div className="flex items-center space-x-3">
           <button className="relative">
             <Bell className="h-5 w-5 text-gray-500 hover:text-gray-700" />
             {/* <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
               2
             </span> */}
           </button>
           <DropdownMenu>
             <DropdownMenuTrigger asChild>
               <Button variant="ghost" className="flex items-center">
                 <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold mr-2">
                   {user?.name?.charAt(0).toUpperCase()}
                 </div>
                 <span className="text-sm font-medium text-foreground hidden md:block">{user?.name}</span>
                 <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
               </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent className="w-56 mt-2">
               <DropdownMenuItem asChild>
                 <Link to="/admin/profile" className="flex items-center">
                   <User className="mr-2 h-4 w-4" />
                   <span>Profile</span>
                 </Link>
               </DropdownMenuItem>
               <DropdownMenuItem asChild>
                 <button onClick={handleLogout} className="flex items-center w-full text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                   <IconLogout className="mr-2 h-4 w-4" />
                   <span>Logout</span>
                 </button>
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
         </div>
       </header>
       <main className="flex-grow p-6 overflow-y-auto bg-background">
         <div className="mx-auto max-w-7xl">
           <Outlet />
         </div>
       </main>
     </div>
   </div>
 );
}