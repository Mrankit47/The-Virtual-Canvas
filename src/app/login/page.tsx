"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense, useState, useRef } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, User, ShieldCheck, Palette, ArrowRight, Smartphone, Mail, KeyRound, ChevronDown, CheckCircle2, Eye, EyeOff, Loader2, X } from "lucide-react";
import ArtLoader from "@/components/ui/ArtLoader";

type Role = "admin" | "artist" | "user";
type AuthMethod = "password" | "otp";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // UI State
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<Role>("user");
  const [method, setMethod] = useState<AuthMethod>("password");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Forgot Password State
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if ((session.user as any).id === "verify-only") {
          return;
      }
      const userRole = (session.user as any).role || "user";
      let targetPath = callbackUrl;

      // Force redirection based on role if no specific callbackUrl or if it's the default dashboard
      if (!targetPath || targetPath === "/dashboard" || targetPath === "/") {
        switch (userRole) {
          case "admin": targetPath = "/admin"; break;
          case "artist": targetPath = "/artist"; break;
          default: targetPath = "/dashboard";
        }
      }
      router.push(targetPath);
    }
  }, [status, session, router, callbackUrl]);

  // Handle Login/Signup Toggle
  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      setError("");
      setOtpSent(false);
  };

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "idle") {
      setError("You have been signed out due to inactivity (10m).");
    }
  }, [searchParams]);

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
        if (!name) { 
            setError("Name is required"); 
            setLoading(false); 
            return; 
        }
        
        if (method === 'password') {
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, role, type: 'email' }),
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);

                await signIn("credentials", { 
                    email, 
                    password, 
                    role, // Passed for role enforcement
                    type: "password", 
                    redirect: true, 
                    callbackUrl: role === 'artist' ? '/artist' : '/dashboard' 
                });
            } catch (err: any) {
                setError(err.message);
                setLoading(false);
            }
        }
    } else {
        const result = await signIn("credentials", {
            email,
            password,
            type: "password",
            role,
            redirect: false,
        });

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        }
    }
  };

  const handleSendOtp = async () => {
    if (!mobile) return setError("Please enter your mobile number");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/otp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile, mode: isSignUp ? 'register' : 'login' }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setOtpSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        const result = await signIn("credentials", {
          mobile,
          otp,
          role, // Passed for role enforcement
          type: "otp",
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
          setLoading(false);
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, mobile, role, type: 'mobile' }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            router.push(role === 'artist' ? '/artist' : '/dashboard');
        } else {
            const userRole = (session?.user as any)?.role || "user";
            router.push(userRole === 'artist' ? '/artist' : '/dashboard');
        }
    } catch (err: any) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
    }
  };

  const handleForgotPasswordSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setForgotLoading(true);
    setError("");

    try {
        const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "send-otp", email: forgotEmail }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP");
        setForgotOtpSent(true);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotOtp || !newPassword) return;
    setForgotLoading(true);
    setError("");

    try {
        const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                action: "reset-password", 
                email: forgotEmail, 
                otp: forgotOtp, 
                password: newPassword 
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to reset password");
        setForgotSuccess(true);
        setTimeout(() => {
            setIsForgotPassword(false);
            setForgotSuccess(false);
            setForgotOtpSent(false);
            setForgotEmail("");
            setForgotOtp("");
            setNewPassword("");
        }, 2000);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setForgotLoading(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (status === "loading") {
      return (
          <div className="min-h-screen flex items-center justify-center bg-canvas">
              <ArtLoader variant="fullscreen" size="md" />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-ink blur-[150px] opacity-20" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-ink blur-[120px] opacity-10" />
      </div>

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] bg-canvas border border-ink/10 rounded-[48px] p-10 md:p-14 shadow-2xl shadow-ink/5 relative backdrop-blur-sm"
      >
        <div className="text-center mb-10">
            <h1 className="text-3xl font-playfair font-bold tracking-tight mb-3">
                {isSignUp ? "Create Account" : "Login"}
            </h1>
            <p className="text-ink/40 text-[10px] uppercase tracking-[0.3em] font-medium">Authentic Art Experience</p>
        </div>

        {/* Role Selection (UI Refined) */}
        <div className="relative mb-8">
            <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-3 text-center font-bold">
                {isSignUp ? "Join As" : "Login As"}
            </p>
            <div className="flex p-1 bg-ink/5 rounded-2xl">
                {(["user", "artist"] as Role[]).map((r) => (
                    <button
                        key={r}
                        onClick={() => { setRole(r as Role); setMethod("password"); }}
                        className={`flex-1 h-11 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${role === r ? "bg-canvas shadow-lg text-ink" : "text-ink/30 hover:text-ink/60"}`}
                    >
                        {r === 'artist' ? <Palette className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        {r}
                    </button>
                ))}
            </div>
        </div>

        {/* Method selection (email/mobile toggle) has been temporarily removed to disable mobile OTP auth */}

        <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
            {method === "password" ? (
                <motion.form 
                    key="form-pw"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleAuth}
                    className="space-y-4"
                >
                    {isSignUp && (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                                <input 
                                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-6 text-sm focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                                    placeholder="your name"
                                />
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Email Address</label>
                        <div className="relative group">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                            <input 
                                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                                className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-6 text-sm focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Password</label>
                        <div className="relative group">
                            <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                            <input 
                                type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
                                className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-12 text-sm focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-ink/5 rounded-xl transition-all text-ink/20 hover:text-ink/60"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end px-2">
                        <button 
                            type="button" 
                            onClick={() => setIsForgotPassword(true)}
                            className="text-[10px] uppercase tracking-widest text-ink/30 hover:text-ink font-bold transition-colors"
                        >
                            Forgot Password?
                        </button>
                    </div>

                    {error && <p className="text-red-500 text-[10px] ml-4 font-bold uppercase tracking-wider">{error}</p>}
                    <button 
                        disabled={loading}
                        className="w-full h-14 bg-ink text-canvas rounded-2xl text-sm font-bold tracking-widest uppercase mt-6 flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-ink/20 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : (isSignUp ? "Create Account" : "Sign In")}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </motion.form>
            ) : (
                <motion.div 
                    key="form-otp"
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-4"
                >
                    {isSignUp && !otpSent && (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                                <input 
                                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-6 text-sm focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                                    placeholder="your name"
                                />
                            </div>
                        </div>
                    )}
                    {!otpSent ? (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Mobile Number</label>
                            <div className="relative group">
                                <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                                <input 
                                    type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} required
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-6 text-sm focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                                    placeholder="+91 00000 00000"
                                />
                            </div>
                            {error && <p className="text-red-500 text-[10px] ml-4 font-bold uppercase tracking-wider mt-2">{error}</p>}
                            <button 
                                onClick={handleSendOtp} disabled={loading}
                                className="w-full h-14 bg-ink text-canvas rounded-2xl text-sm font-bold tracking-widest uppercase mt-6 flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-ink/20 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : "Send OTP"}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Enter Code</label>
                            <div className="relative group">
                                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                                <input 
                                    type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6}
                                    className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-6 text-sm tracking-[1em] font-bold focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                                    placeholder="000000"
                                />
                            </div>
                            <p className="text-[10px] text-ink/40 ml-4 mt-2">Code sent to {mobile}. <button onClick={() => setOtpSent(false)} className="underline">Change Number</button></p>
                            {error && <p className="text-red-500 text-[10px] ml-4 font-bold uppercase tracking-wider mt-2">{error}</p>}
                            <button 
                                disabled={loading}
                                className="w-full h-14 bg-ink text-canvas rounded-2xl text-sm font-bold tracking-widest uppercase mt-6 flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-ink/20 transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : (isSignUp ? "Verify & Register" : "Verify & Sign In")}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
        </div>

        <div className="mt-8 text-center">
            <button 
                onClick={toggleMode}
                className="text-xs font-bold uppercase tracking-widest text-ink/40 hover:text-ink transition-colors"
            >
                {isSignUp ? "Already have an account? Login" : "New here? Create an account"}
            </button>
        </div>
      </motion.div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isForgotPassword && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-canvas/80 backdrop-blur-md"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-canvas border border-ink/10 rounded-[40px] p-10 shadow-2xl relative"
                >
                    <button onClick={() => setIsForgotPassword(false)} className="absolute top-8 right-8 p-2 hover:bg-ink/5 rounded-full"><X className="w-5 h-5" /></button>
                    
                    <h2 className="text-2xl font-playfair font-bold mb-2">Reset Password</h2>
                    <p className="text-[10px] uppercase tracking-widest text-ink/40 mb-8">Secure Recovery Process</p>

                    {forgotSuccess ? (
                        <div className="py-10 text-center space-y-4">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                            <p className="text-sm font-bold uppercase tracking-widest text-ink">Password Reset Successfully!</p>
                            <p className="text-xs text-ink/40">You'll be redirected to login shortly.</p>
                        </div>
                    ) : (
                        <form onSubmit={forgotOtpSent ? handleResetPassword : handleForgotPasswordSendOtp} className="space-y-6">
                            {!forgotOtpSent ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Your Email</label>
                                        <input 
                                            type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required
                                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm outline-none focus:border-ink/20 transition-all"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                    <button 
                                        disabled={forgotLoading}
                                        className="w-full h-14 bg-ink text-canvas rounded-2xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                    >
                                        {forgotLoading ? <Loader2 className="animate-spin" size={16} /> : "Send Reset Code"}
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Verification Code</label>
                                        <input 
                                            type="text" value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} required maxLength={6}
                                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm tracking-[1em] text-center font-bold outline-none focus:border-ink/20 transition-all"
                                            placeholder="000000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">New Password</label>
                                        <input 
                                            type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl px-6 text-sm outline-none focus:border-ink/20 transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <button 
                                        disabled={forgotLoading}
                                        className="w-full h-14 bg-ink text-canvas rounded-2xl text-xs font-bold tracking-widest uppercase flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                                    >
                                        {forgotLoading ? <Loader2 className="animate-spin" size={16} /> : "Reset & Finalize"}
                                    </button>
                                    <button 
                                        type="button" onClick={() => setForgotOtpSent(false)}
                                        className="w-full text-[10px] uppercase tracking-widest text-ink/30 font-bold hover:text-ink transition-colors"
                                    >
                                        Wrong email? Start Over
                                    </button>
                                </div>
                            )}
                            {error && <p className="text-red-500 text-[10px] text-center font-bold uppercase tracking-wider">{error}</p>}
                        </form>
                    )}
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <ArtLoader variant="fullscreen" size="md" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
