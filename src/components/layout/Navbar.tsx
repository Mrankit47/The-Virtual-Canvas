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
        className={`text-[9px] uppercase tracking-[0.2em] font-bold border ${isPhotography ? 'border-white/20 hover:bg-white hover:text-black' : 'border-black/20 hover:bg-black hover:text-white'} px-4 py-1.5 transition-all duration-500 rounded-full bg-current/5 backdrop-blur-sm pointer-events-auto`}
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
        className={`group flex items-center gap-2 p-0.5 pr-3 bg-current/5 hover:bg-current/10 border ${isPhotography ? 'border-white/10' : 'border-black/10'} rounded-full transition-all duration-300 backdrop-blur-md`}
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
          <div className={`w-7 h-7 rounded-full ${isPhotography ? 'bg-white text-black' : 'bg-black text-white'} flex items-center justify-center text-[9px] font-bold`}>
            {name[0]}
          </div>
        )}
        <span className="text-[9px] uppercase tracking-widest font-bold hidden md:block">{name.split(' ')[0]}</span>
        <svg className={`w-2.5 h-2.5 opacity-40 transition-transform duration-500 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className={`absolute bg-black/80 backdrop-blur-2xl text-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 origin-bottom-left lg:origin-top-right ${
              // Anchor to left on mobile to avoid overflow, right on desktop
              'left-0 lg:left-auto lg:right-0 w-48 lg:w-64 bottom-14 lg:top-14 lg:bottom-auto'
            }`}
          >
            {/* User Profile Header */}
            <div className="px-4 lg:px-6 py-4 lg:py-6 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                 <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white text-black flex items-center justify-center text-[10px] lg:text-xs font-bold">
                    {name[0]}
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-[10px] lg:text-xs font-bold truncate">{name}</p>
                    <p className="text-[8px] lg:text-[9px] opacity-40 truncate uppercase tracking-widest mt-0.5">{session.user?.email}</p>
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isPhotography = pathname?.startsWith('/photography');
  const navColor = isPhotography ? 'text-white' : 'text-black';
  const navBg = isPhotography 
    ? 'bg-black/10 md:bg-black/20 backdrop-blur-xl border-b border-white/5' 
    : 'bg-transparent';

  const userRole = (session?.user as any)?.role;

  const allNavLinks = [
    { name: 'Artworks', href: '/artworks' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Photography', href: '/photography' },
    { name: 'Process', href: '/process' },
    { name: 'Commission Art', href: '/order', userOnly: true },
    { name: 'Track Order', href: '/track-order', userOnly: true },
  ];

  // Hide customer-only links (Commission Art, Track Order) for admin and artist
  const navLinks = allNavLinks.filter(link => 
    !link.userOnly || !userRole || userRole === 'user'
  );

  return (
    <>
      <header className={`fixed top-0 w-full z-50 ${navColor} px-4 py-2 sm:px-6 sm:py-3 flex justify-between items-center ${navBg} pointer-events-none transition-all duration-500`}>
        <Link href="/" aria-label="Home - The Virtual Canvas" className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl tracking-tighter hover:opacity-70 transition-opacity pointer-events-auto leading-tight break-words">
          The Virtual Canvas
        </Link>
        
        {/* Desktop Navigation */}
        <nav aria-label="Main Navigation" className="hidden lg:flex gap-8 text-[10px] xl:text-[11px] uppercase tracking-[0.15em] font-medium items-center pointer-events-none">
          {navLinks.map((link, idx) => (
            <Link key={link.href} href={link.href} className="group relative pointer-events-auto">
              {link.name}
              <span className={`absolute -bottom-1.5 left-0 w-0 h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} group-hover:w-full transition-all duration-300 delay-${idx * 25}`}></span>
            </Link>
          ))}

          {/* Cart Icon (Only show if logged in as a normal User) */}
          {session && (session.user as any)?.role === 'user' && (
            <Link href="/cart" aria-label={`Cart (${itemCount} items)`} className="relative flex items-center justify-center hover:opacity-70 transition-opacity ml-1 pointer-events-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
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

        {/* Mobile Controls */}
        <div className="flex lg:hidden items-center gap-6 pointer-events-auto">
          {session && (session.user as any)?.role === 'user' && (
             <Link href="/cart" className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {itemCount > 0 && (
                  <span className={`absolute -top-2 -right-2 w-4 h-4 ${isPhotography ? 'bg-white text-black' : 'bg-black text-white'} text-[9px] font-bold rounded-full flex items-center justify-center`}>
                    {itemCount}
                  </span>
                )}
             </Link>
          )}
          
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="relative z-50 w-6 h-6 flex flex-col justify-between items-center"
            aria-label="Toggle Menu"
          >
            <span className={`w-full h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
            <span className={`w-full h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-full h-[1.5px] ${isPhotography ? 'bg-white' : 'bg-black'} transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className={`fixed inset-0 z-[45] ${isPhotography ? 'bg-black/95 text-white' : 'bg-canvas/95 text-ink'} backdrop-blur-2xl flex flex-col px-6 py-8 pt-24 max-h-screen overflow-y-auto`}
          >
            <div className={`absolute inset-0 flex items-center justify-center opacity-[0.03] font-serif text-[35vw] leading-none select-none pointer-events-none z-0 ${isPhotography ? 'text-white' : 'text-ink'}`}>
              TVC
            </div>
          
            <nav className="flex flex-col gap-8 relative z-10">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 + 0.2 }}
                >
                  <Link 
                    href={link.href} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group flex items-baseline gap-4"
                  >
                    <span className={`font-serif text-[10px] uppercase tracking-widest ${isPhotography ? 'text-white/30' : 'text-ink/20'} group-hover:opacity-100 transition-opacity`}>0{idx + 1}</span>
                    <span className="text-2xl sm:text-3xl font-serif tracking-tighter hover:translate-x-3 transition-transform duration-500 inline-block">
                      {link.name}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="mt-auto pt-10 border-t border-ink/5 relative z-10">
               <div className="flex flex-col gap-6">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold opacity-30">Identity & Access</p>
                  <div className="flex items-center justify-between">
                     <AuthButton session={session} status={status} isPhotography={isPhotography} />
                     
                     {session && (session.user as any)?.role === 'user' && (
                        <Link 
                          href="/cart" 
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-6 py-3 border border-ink/10 rounded-full"
                        >
                           <span className="text-[10px] uppercase tracking-widest font-bold">Cart Items</span>
                           <span className="w-6 h-6 rounded-full bg-ink text-white flex items-center justify-center text-[10px] font-bold">
                              {itemCount}
                           </span>
                        </Link>
                     )}
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

