'use client';

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { User, Mail, Shield, Phone, History, Camera, Check, Loader2 } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  if (!session) return null;

  const userRole = (session.user as any)?.role || 'User';
  const userMobile = (session.user as any)?.mobile || '';
  const userImage = session.user?.image || '';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !preset) {
      addToast('Cloudinary configuration missing', 'error');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', preset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const imageUrl = data.secure_url;

      // Update in Sanity
      const updateRes = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!updateRes.ok) throw new Error('Failed to update profile image in database');

      // Update local session
      await update({ image: imageUrl });
      addToast('Profile picture updated!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl pb-20">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 bg-white p-8 rounded-3xl border border-ink/5 shadow-sm">
        <div className="relative group">
          <div className="w-24 h-24 bg-ink/5 rounded-2xl flex items-center justify-center border border-ink/10 overflow-hidden text-ink/20 relative shadow-inner">
            {uploading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-ink" />
                </div>
            )}
            {userImage ? (
                <img src={userImage} alt={session.user?.name || ''} className="w-full h-full object-cover" />
            ) : (
                <User size={40} />
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-2 -right-2 p-3 bg-ink text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 z-30"
          >
            <Camera size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold font-playfair text-ink">{session.user?.name}</h1>
          <div className="flex items-center gap-3">
            <p className="text-xs text-ink/40 font-mono uppercase tracking-widest">{userRole} Account</p>
            <div className="w-1 h-1 rounded-full bg-ink/20" />
            <p className="text-xs text-green-600 font-bold uppercase tracking-widest flex items-center gap-1">
                <Check size={12} /> Active
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Contact Info */}
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Personal Details</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-blue-50 transition-colors">
                <Mail size={20} className="text-ink/30 group-hover:text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Email Address</p>
                <p className="text-sm font-bold text-ink">{session.user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-green-50 transition-colors">
                <Phone size={20} className="text-ink/30 group-hover:text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Mobile Number</p>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink">
                        { userMobile ? (userMobile.startsWith('+91') ? userMobile : `+91 ${userMobile}`) : 'Not Provided' }
                    </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security / Role Info */}
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Access & ID</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                <Shield size={20} className="text-ink/30 group-hover:text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Security Access</p>
                <p className="text-sm font-bold text-ink capitalize">{userRole} Level</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-purple-50 transition-colors">
                <History size={20} className="text-ink/30 group-hover:text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Member Since</p>
                <p className="text-sm font-bold text-ink">April 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
