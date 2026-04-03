'use client';

import { useSession } from "next-auth/react";
import { User, Mail, Shield, Phone, History, Camera } from "lucide-react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) return null;

  const userRole = (session.user as any)?.role || 'User';

  return (
    <div className="space-y-12 max-w-4xl">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-white p-8 rounded-3xl border border-ink/5 shadow-sm">
        <div className="relative group">
          <div className="w-24 h-24 bg-ink/5 rounded-2xl flex items-center justify-center border border-ink/10 overflow-hidden text-ink/20">
            {session.user?.image ? (
                <img src={session.user.image} alt={session.user.name || ''} className="w-full h-full object-cover" />
            ) : (
                <User size={40} />
            )}
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-ink text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera size={14} />
          </button>
        </div>

        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold font-playfair text-ink">{session.user?.name}</h1>
          <p className="text-sm text-ink/40 font-mono uppercase tracking-widest">{userRole} Account</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Personal Details</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-blue-50 transition-colors">
                <Mail size={18} className="text-ink/40 group-hover:text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-ink/40">Email Address</p>
                <p className="text-sm font-semibold text-ink">{session.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors">
                <Phone size={18} className="text-ink/40 group-hover:text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-ink/40">Mobile Number</p>
                <p className="text-sm font-semibold text-ink">{ (session.user as any)?.mobile || '+91' }</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Role Info */}
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Access & ID</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                <Shield size={18} className="text-ink/40 group-hover:text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-ink/40">Current Access Level</p>
                <p className="text-sm font-semibold text-ink capitalize">{userRole}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="p-3 rounded-xl bg-gray-50 group-hover:bg-purple-50 transition-colors">
                <History size={18} className="text-ink/40 group-hover:text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-widest text-ink/40">Account Active Since</p>
                <p className="text-sm font-semibold text-ink">April 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
