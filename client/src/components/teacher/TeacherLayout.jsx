import React from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, ChevronDown, User, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SocketProvider } from '../../context/SocketContext';
import NotificationHandler from '../NotificationHandler';
import { Toaster } from 'react-hot-toast';
import { useNotificationStore } from '../../stores/notificationStore';
import { formatDistanceToNow } from 'date-fns';
import TeacherSidebar from './TeacherSidebar';
import ConversationList from '@/components/ConversationList';

const NotificationList = () => {
  const notifications = useNotificationStore(state => state.notifications);
  if (notifications.length === 0) return <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>;

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map(n => (
        <Link 
          to={n.link || '#'} 
          key={n.id} 
          className={`block p-3 border-b hover:bg-gray-50 ${!n.isRead ? 'bg-indigo-50' : ''}`}
        >
          <p className="text-sm text-gray-800">{n.content}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
          </p>
        </Link>
      ))}
    </div>
  );
};

export default function TeacherLayout() {
 const { user, logout } = useAuth();
 const { unreadCount, unreadChatCount, markAllGeneralAsRead, fetchNotifications, markChatAsRead } = useNotificationStore();
 const location = useLocation();
 const navigate = useNavigate();
 
 // Muat notifikasi saat komponen pertama kali dirender
 React.useEffect(() => {
   fetchNotifications();
 }, [fetchNotifications]);

 const getPageTitle = (pathname) => {
    const pathTitleMap = {
      '/teacher': 'Dashboard',
      '/teacher/courses': 'Courses',
      '/teacher/bookings': 'Bookings',
      '/teacher/schedules': 'Schedules',
      '/teacher/payouts': 'Honorarium',
      '/teacher/settings': 'Settings',
      '/teacher/profile': 'My Profile',
      '/teacher/notifications': 'Notifications',
      '/teacher/chat': 'Chat',
    };

    if (pathname.startsWith('/teacher/schedules/')) {
      return 'Schedule Details';
    }
    if (pathname.startsWith('/teacher/chat/')) {
      return 'Chat';
    }
    
    return pathTitleMap[pathname] || 'Dashboard';
 };

 const pageTitle = getPageTitle(location.pathname);

 const handleLogout = () => {
   logout();
   navigate('/login');
 };

 const userAvatarUrl = user?.avatarUrl
    ? `${import.meta.env.VITE_API_URL.replace('/api', '')}${user.avatarUrl}`
    : `https://ui-avatars.com/api/?name=${user?.name?.replace(/\s/g, '+')}&background=random`;

 return (
   <SocketProvider>
     <div className="flex h-screen bg-gray-100">
       <TeacherSidebar />
       <div className="flex-grow flex flex-col">
         <header className="bg-white shadow-sm h-14 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
           <div className="flex items-center">

             <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
           </div>
           <div className="flex items-center space-x-3">

            <Popover onOpenChange={(open) => { if (open) markChatAsRead() }}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" title="Chats">
                  <Mail className="h-6 w-6 text-gray-500 hover:text-gray-900" />
                  {unreadChatCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                      {unreadChatCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-3 border-b"><h3 className="font-semibold">Pesan</h3></div>
                <ConversationList />
                <div className="p-2 text-center border-t">
                  <Link to={`/${user.role.toLowerCase()}/chat`} className="text-sm text-indigo-600 hover:underline">Buka semua chat</Link>
                </div>
              </PopoverContent>
            </Popover>
             
             <div className="flex items-center">
                         <Popover onOpenChange={(open) => {
                           if (open) markAllGeneralAsRead();
                         }}>
                           <PopoverTrigger asChild>
                             <Button variant="ghost" size="icon" className="relative" title="Notifications">
                               <Bell className="h-5 w-5 text-gray-500 hover:text-gray-900" />
                               {unreadCount > 0 && (
                                 <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs">
                                   {unreadCount > 9 ? '9+' : unreadCount}
                                 </span>
                               )}
                             </Button>
                           </PopoverTrigger>
                           <PopoverContent className="w-80 p-0" align="end">
                             <div className="p-3 border-b">
                               <h3 className="font-semibold">Notifications</h3>
                             </div>
                             <NotificationList />
                             <div className="p-2 text-center border-t">
                               <Link to={`/${user.role.toLowerCase()}/notifications`} className="text-sm text-indigo-600 hover:underline">Lihat semua notifikasi</Link>
                             </div>
                           </PopoverContent>
                         </Popover>
                         </div>

             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" className="flex items-center">
                    <Avatar className="w-8 h-8 mr-2">
                        <AvatarImage src={userAvatarUrl} alt={user?.name} />
                        <AvatarFallback>{user?.name?.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                    </Avatar>
                   <span className="text-sm font-medium text-foreground hidden md:block">{user?.name}</span>
                   <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                 </Button>
               </DropdownMenuTrigger>
             <DropdownMenuContent className="w-56 mt-2">
               <DropdownMenuItem asChild>
                 <Link to="/teacher/profile" className="flex items-center">
                   <User className="mr-2 h-4 w-4" />
                   <span>Profile</span>
                 </Link>
               </DropdownMenuItem>
               <DropdownMenuItem asChild>
                 <button onClick={handleLogout} className="flex items-center w-full text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
                   <LogOut className="mr-2 h-4 w-4" />
                   <span>Logout</span>
                 </button>
               </DropdownMenuItem>
             </DropdownMenuContent>
           </DropdownMenu>
           </div>
         </header>
         <main className="flex-grow p-6 overflow-y-auto bg-background">
           <NotificationHandler />
           <Toaster 
           position="top-right" 
            toastOptions={{
              duration: 5000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
           />
           <div className="mx-auto max-w-7xl">
             <Outlet />
           </div>
         </main>
       </div>
     </div>
   </SocketProvider>
 );
}