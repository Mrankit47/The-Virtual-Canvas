'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'admin' | 'artist' | 'user';
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Authentication & Authorization Guard
  if (status === 'loading') return null;
  if (!session) redirect('/login');
  
  const currentRole = (session.user as any)?.role || 'user';
  if (currentRole !== userRole) redirect(currentRole === 'admin' ? '/admin' : currentRole === 'artist' ? '/artist' : '/dashboard');

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-full">
        <Sidebar role={userRole} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/5 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 lg:hidden transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar role={userRole} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-gray-50/50 p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
