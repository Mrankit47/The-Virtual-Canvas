'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  User, 
  LogOut, 
  Upload, 
  Wallet,
  Settings,
  MessageSquare,
  Compass
} from 'lucide-react';

interface SidebarProps {
  role: 'admin' | 'artist' | 'user';
  onClose?: () => void;
}

export default function Sidebar({ role, onClose }: SidebarProps) {
  const pathname = usePathname();

  const commonLinks = [
    { name: 'Art Explore', href: '/', icon: Compass },
    { name: 'Dashboard', href: role === 'admin' ? '/admin' : role === 'artist' ? '/artist' : '/dashboard', icon: LayoutDashboard },
    { name: 'My Orders', href: `${role === 'admin' ? '/admin' : role === 'artist' ? '/artist' : '/dashboard'}/orders`, icon: ShoppingBag },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const artistLinks = [
    { name: 'Upload Work', href: '/artist/upload', icon: Upload },
    { name: 'Earnings', href: '/artist/earnings', icon: Wallet },
  ];

  const adminLinks = [
    { name: 'Manage Artists', href: '/admin/artists', icon: Settings },
    { name: 'All Communications', href: '/admin/messages', icon: MessageSquare },
  ];

  const links = [
    ...commonLinks,
    ...(role === 'artist' ? artistLinks : []),
    ...(role === 'admin' ? adminLinks : []),
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-ink/5 w-64">
      <div className="p-8">
        <Link href="/" className="font-serif text-xl tracking-tighter">
          The Virtual Canvas
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                isActive 
                  ? 'bg-ink text-white shadow-lg shadow-ink/20' 
                  : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
              }`}
            >
              <Icon size={18} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ink/5">
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
