'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

function AuthButton({ session, status, isPhotography }: { session: any, status: string, isPhotography: boolean }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (status === 'loading') {
    return <div className={`w-8 h-8 rounded-full border border-current opacity-20 animate-pulse bg-current/5`} />;
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className={`text-[10px] uppercase tracking-[0.3em] font-bold border ${isPhotography ? 'border-white/20 hover:bg-white hover:text-black' : 'border-black/20 hover:bg-black hover:text-white'} px-6 py-2 transition-all duration-500 rounded-full bg-current/5 backdrop-blur-sm pointer-events-auto`}
      >
        Sign In
      </Link>
    );
  }

  const role = (session.user as any)?.role;
  const dashboardLink =
    role === 'admin' ? '/admin' :
    role === 'artist' ? '/artist' :
    '/dashboard';
  
  const dashboardLabel =
    role === 'admin' ? '👑 Admin Studio' :
    role === 'artist' ? '🎨 Creator Panel' :
    '📦 My Commissions';

  const avatarUrl = session.user?.image;
  const name = session.user?.name || 'User';

  return (
    <div className="relative pointer-events-auto" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-3 p-1 pr-4 bg-current/5 hover:bg-current/10 border ${isPhotography ? 'border-white/10' : 'border-black/10'} rounded-full transition-all duration-300 backdrop-blur-md`}
      >
        {avatarUrl ? (
          <div className="relative w-8 h-8">
            <Image 
              src={avatarUrl} alt={name} fill
              sizes="32px"
              className={`rounded-full border ${isPhotography ? 'border-white/20' : 'border-black/20'} object-cover`} 
            />
          </div>
        ) : (
          <div className={`w-8 h-8 rounded-full ${isPhotography ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center text-[10px] font-bold`}>
            {name[0]}
          </div>
        )}
        <span className="text-[10px] uppercase tracking-widest font-bold hidden md:block">{name.split(' ')[0]}</span>
        <svg className={`w-3 h-3 opacity-40 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Premium Dropdown */}
      <AnimatePresence mode="wait">
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 top-14 w-64 bg-black/80 backdrop-blur-2xl text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 origin-top-right"
          >
            {/* User Profile Header */}
            <div className="px-6 py-6 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-3">
                 <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                    {name[0]}
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-xs font-bold truncate">{name}</p>
                    <p className="text-[9px] opacity-40 truncate uppercase tracking-widest mt-0.5">{session.user?.email}</p>
                 </div>
              </div>
              {role && (
                <span className="inline-block text-[8px] uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-white/10 text-white/60 font-bold border border-white/5">
                  {role} Role
                </span>
              )}
            </div>

            {/* Navigation Grid */}
            <div className="p-2">
               <Link
                href={dashboardLink}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between group px-4 py-4 rounded-xl hover:bg-white text-white hover:text-black transition-all duration-300"
              >
                <div>
                   <p className="text-[10px] uppercase tracking-widest font-bold opacity-40 group-hover:opacity-100 mb-0.5">Control Center</p>
                   <p className="text-xs font-medium">{dashboardLabel}</p>
                </div>
                <ChevronRight size={14} className="opacity-20 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>

            {/* Logout Footer */}
            <div className="p-2 border-t border-white/10">
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full flex items-center gap-3 px-4 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-red-500/10 text-red-400 transition-all rounded-xl"
              >
                <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                   </svg>
                </div>
                Log Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const { itemCount } = useCart();
  const pathname = usePathname();

  const isPhotography = pathname?.startsWith('/photography');
  const navColor = isPhotography ? 'text-white' : 'text-black';
  const navBg = isPhotography 
    ? 'bg-black/10 md:bg-black/20 backdrop-blur-xl border-b border-white/5' 
    : 'bg-transparent';

  return (
    <header className={`fixed top-0 w-full z-50 ${navColor} px-6 md:px-12 py-6 flex justify-between items-center ${navBg} pointer-events-none transition-all duration-500`}>
      <Link href="/" aria-label="Home - The Virtual Canvas" className="font-serif text-3xl md:text-4xl tracking-tighter hover:opacity-70 transition-opacity pointer-events-auto">
        The Virtual Canvas
      </Link>
      <nav aria-label="Main Navigation" className="hidden md:flex gap-10 text-xs uppercase tracking-[0.2em] font-medium items-center pointer-events-none">
        <Link href="/artworks" className="group relative pointer-events-auto">
          Artworks
          <span className={`absolute -bottom-2 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300`}></span>
        </Link>
        <Link href="/gallery" className="group relative pointer-events-auto">
          Gallery
          <span className={`absolute -bottom-2 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300`}></span>
        </Link>
        <Link href="/photography" className="group relative pointer-events-auto">
          Photography
          <span className={`absolute -bottom-2 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300 delay-75`}></span>
        </Link>
        <Link href="/process" className="group relative pointer-events-auto">
          Process
          <span className={`absolute -bottom-2 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300 delay-100`}></span>
        </Link>
        <Link href="/order" className="group relative pointer-events-auto">
          Commission Art
          <span className={`absolute -bottom-2 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300 delay-150`}></span>
        </Link>
        <Link href="/track-order" className="group relative pointer-events-auto">
          Track Order
          <span className={`absolute -bottom-2 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300 delay-200`}></span>
        </Link>

        {/* Cart Icon (Only show if logged in as a normal User) */}
        {session && (session.user as any)?.role === 'user' && (
          <Link href="/cart" aria-label={`Cart (${itemCount} items)`} className="relative flex items-center justify-center hover:opacity-70 transition-opacity ml-2 pointer-events-auto">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            {itemCount > 0 && (
              <span className={`absolute -top-2 -right-2 w-4 h-4 ${isPhotography ? 'bg-white text-black' : 'bg-black text-white'} text-[9px] font-bold rounded-full flex items-center justify-center leading-none`}>
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
        )}

        {/* Auth Button */}
        <div className="pointer-events-auto">
          <AuthButton session={session} status={status} isPhotography={isPhotography} />
        </div>
      </nav>
    </header>
  );
}

