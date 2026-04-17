'use client';

import { Menu, Search, User } from "lucide-react";
import { useSession } from "next-auth/react";
import NotificationBell from "./NotificationBell";
import { urlFor } from "@/lib/sanity";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="h-16 sm:h-20 bg-white border-b border-ink/5 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-ink/60 hover:bg-ink/5 rounded-xl transition-colors active:scale-90"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        
        <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-ink/5 rounded-xl px-4 py-2 w-64 lg:w-96 text-ink/40 focus-within:border-ink/20 transition-all">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search orders, artists..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-ink placeholder:text-ink/30"
          />
        </div>

        {/* Brand name for mobile only if it fits, or just leave it for sidebar */}
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <NotificationBell />

        <div className="h-6 w-[1px] bg-ink/5 mx-1" />

        <div className="flex items-center gap-3 group cursor-pointer active:scale-95 transition-transform">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-ink leading-none">{session?.user?.name || 'User'}</p>
            <p className="text-[10px] text-ink/30 uppercase font-extrabold tracking-widest mt-1">{(session?.user as any)?.role || 'Buyer'}</p>
          </div>
          
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden transition-all group-hover:border-ink/20 shadow-sm">
            {session?.user?.image ? (
              <img 
                src={typeof session.user.image === 'string' ? session.user.image : urlFor(session.user.image).url()} 
                alt="Avatar" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <User size={18} className="text-ink/40" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
