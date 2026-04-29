'use client';

import { useSession } from "next-auth/react";
import { useState, useRef } from "react";
import { User, Mail, Shield, Phone, History, Camera, Check, Loader2, Edit2, X, Lock } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { ImageCropper } from "@/components/ui/ImageCropper";
import { urlFor } from "@/lib/sanity";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  // Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [activeEditField, setActiveEditField] = useState<'email' | 'mobile' | 'password' | null>(null);
  const [editValue, setEditValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const userRole = (session.user as any)?.role || 'User';
  const userMobile = (session.user as any)?.mobile || '';
  const sessionImage = session.user?.image;
  
  const userImage = typeof sessionImage === 'string' 
    ? sessionImage 
    : (sessionImage ? urlFor(sessionImage).url() : '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImageToCrop(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveCroppedImage = async (croppedBlob: Blob) => {
    setImageToCrop(null);
    try {
      setUploading(true);
      const role = userRole.toLowerCase();
      const folder = `TVC assets/Profile photos/${role === 'admin' ? 'admin' : role === 'artist' ? 'artist' : 'user'}`;
      const imageUrl = await uploadToCloudinary(croppedBlob, folder);

      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      });

      if (!res.ok) throw new Error('Failed to update profile image');
      await update({ image: imageUrl });
      addToast('Profile picture updated!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editValue.trim() || editValue === session.user?.name) {
        setIsEditingName(false);
        return;
    }
    try {
        setUpdating(true);
        const res = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editValue }),
        });
        if (!res.ok) throw new Error('Failed to update name');
        await update({ name: editValue });
        addToast('Name updated successfully!', 'success');
        setIsEditingName(false);
    } catch (err: any) {
        addToast(err.message, 'error');
    } finally {
        setUpdating(false);
    }
  };

  const handleSendOTP = async () => {
    if (!activeEditField) return;
    try {
        setLoading(true);
        const res = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send-otp', targetField: activeEditField }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
        setOtpSent(true);
        addToast('Verification code sent to your email', 'success');
    } catch (err: any) {
        addToast(err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!activeEditField || !otpValue) return;
    try {
        setLoading(true);
        const body: any = { action: 'verify-update', otp: otpValue };
        if (activeEditField === 'email') body.email = editValue;
        if (activeEditField === 'mobile') body.mobile = editValue;
        if (activeEditField === 'password') body.password = editValue;

        const res = await fetch('/api/user/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');

        // Update local session
        const updateData: any = {};
        if (activeEditField === 'email') updateData.email = editValue;
        if (activeEditField === 'mobile') updateData.mobile = editValue;
        await update(updateData);

        addToast(`${activeEditField} updated successfully!`, 'success');
        closeModals();
    } catch (err: any) {
        addToast(err.message, 'error');
    } finally {
        setLoading(false);
    }
  };

  const closeModals = () => {
    setActiveEditField(null);
    setEditValue("");
    setOtpValue("");
    setOtpSent(false);
  };

  return (
    <div className="space-y-12 max-w-4xl pb-20">
      {/* Header Profile Section */}
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
          <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="absolute -bottom-2 -right-2 p-3 bg-ink text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 z-30">
            <Camera size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
                {isEditingName ? (
                    <div className="flex items-center gap-2">
                        <input 
                            type="text" 
                            autoFocus
                            value={editValue} 
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                            className="text-2xl font-bold font-playfair text-ink bg-transparent border-b-2 border-ink outline-none px-1"
                        />
                        <button onClick={handleUpdateName} disabled={updating} className="text-green-600 hover:text-green-700">
                            {updating ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        </button>
                        <button onClick={() => setIsEditingName(false)} className="text-red-400 hover:text-red-500">
                            <X size={20} />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold font-playfair text-ink">{session.user?.name}</h1>
                        <button 
                            onClick={() => { setIsEditingName(true); setEditValue(session.user?.name || ""); }}
                            className="p-2 hover:bg-ink/5 rounded-full text-ink/20 hover:text-ink transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                )}
            </div>
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
        {/* Personal Details */}
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Personal Details</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-blue-50 transition-colors">
                <Mail size={20} className="text-ink/30 group-hover:text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Email Address</p>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink">{session.user?.email}</p>
                    <button 
                        onClick={() => { setActiveEditField('email'); setEditValue(session.user?.email || ""); }}
                        className="text-[10px] text-ink/30 hover:text-ink uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                    >
                        Change
                    </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-green-50 transition-colors">
                <Phone size={20} className="text-ink/30 group-hover:text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Mobile Number</p>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink">
                        { userMobile ? (userMobile.startsWith('+91') ? userMobile : `+91 ${userMobile}`) : 'Not Provided' }
                    </p>
                    <button 
                        onClick={() => { setActiveEditField('mobile'); setEditValue(userMobile || ""); }}
                        className="text-[10px] text-ink/30 hover:text-ink uppercase font-bold tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                    >
                        Update
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & System Info */}
        <div className="bg-white p-8 rounded-3xl border border-ink/5 shadow-sm space-y-6">
          <h2 className="text-lg font-bold font-playfair text-ink border-b border-ink/5 pb-4">Security & Access</h2>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveEditField('password')}>
              <div className="p-4 rounded-2xl bg-gray-50 group-hover:bg-red-50 transition-colors">
                <Lock size={20} className="text-ink/30 group-hover:text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Account Password</p>
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink">••••••••••••</p>
                    <span className="text-[10px] text-ink/30 uppercase font-bold tracking-widest group-hover:text-ink">Update</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-gray-50">
                <Shield size={20} className="text-ink/30" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink/40 font-bold mb-1">Access Level</p>
                <p className="text-sm font-bold text-ink capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal / Backdrop */}
      {activeEditField && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={closeModals} />
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-ink/10">
                <div className="p-8 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-2xl font-bold font-playfair text-ink">Update {activeEditField}</h3>
                        <button onClick={closeModals} className="p-2 hover:bg-ink/5 rounded-full"><X size={20} /></button>
                    </div>

                    <div className="space-y-4">
                        {!otpSent ? (
                            <div className="space-y-4">
                                <p className="text-sm text-ink/60">Enter your new {activeEditField}. We'll send a code to your registered email to verify it's you.</p>
                                <input 
                                    type={activeEditField === 'password' ? 'password' : 'text'}
                                    placeholder={`New ${activeEditField}`}
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-full bg-ink/5 border border-ink/10 p-4 rounded-2xl outline-none focus:border-ink transition-colors font-bold"
                                />
                                <button 
                                    onClick={handleSendOTP}
                                    disabled={loading || !editValue}
                                    className="w-full bg-ink text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-ink/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Send Verification Code'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-ink/60">Enter the 6-digit code sent to <strong>{session.user?.email}</strong></p>
                                <input 
                                    type="text"
                                    maxLength={6}
                                    placeholder="Enter OTP"
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value)}
                                    className="w-full bg-ink/5 border border-ink/10 p-4 rounded-2xl outline-none focus:border-ink transition-colors font-mono text-2xl tracking-[0.5em] text-center"
                                />
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setOtpSent(false)} 
                                        className="flex-1 border border-ink/10 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-ink/5 transition-all"
                                    >
                                        Change Details
                                    </button>
                                    <button 
                                        onClick={handleVerifyAndUpdate}
                                        disabled={loading || otpValue.length < 6}
                                        className="flex-[2] bg-ink text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-ink/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Verify & Update'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {imageToCrop && (
        <ImageCropper image={imageToCrop} onCropComplete={handleSaveCroppedImage} onCancel={() => setImageToCrop(null)} />
      )}
    </div>
  );
}
