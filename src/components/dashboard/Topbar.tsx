'use client';

import { Menu, Search, User } from "lucide-react";
import { useSession } from "next-auth/react";
import NotificationBell from "./NotificationBell";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { data: session } = useSession();

  return (
    <header className="h-20 bg-white border-b border-ink/5 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-ink/60 hover:bg-ink/5 rounded-lg"
        >
          <Menu size={20} />
        </button>
        
        <div className="hidden md:flex items-center gap-3 bg-gray-50 border border-ink/5 rounded-xl px-4 py-2 w-64 lg:w-96 text-ink/40">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search orders, artists..." 
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-ink"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <NotificationBell />

        <div className="h-8 w-[1px] bg-ink/5 mx-2" />

        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-ink leading-none">{session?.user?.name || 'User'}</p>
            <p className="text-[10px] text-ink/40 uppercase tracking-widest mt-1">{(session?.user as any)?.role || 'Buyer'}</p>
          </div>
          
          <div className="w-10 h-10 rounded-xl bg-ink/5 border border-ink/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-ink/40" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
