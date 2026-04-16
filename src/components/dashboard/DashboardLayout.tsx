'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
      <aside className="hidden lg:block h-full flex-shrink-0">
        <Sidebar role={userRole} />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[60] lg:hidden"
            >
              <Sidebar role={userRole} onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
