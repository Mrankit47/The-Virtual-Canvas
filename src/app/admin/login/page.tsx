"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, Suspense, useState } from "react";
import type { FormEvent } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, Mail, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import ArtLoader from "@/components/ui/ArtLoader";

function AdminLoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if ((session.user as any).id === "verify-only") {
          return;
      }
      const userRole = (session.user as any).role || "user";
      
      if (userRole === "admin") {
          router.push(callbackUrl || "/admin");
      } else {
          router.push(userRole === "artist" ? "/artist" : "/dashboard");
      }
    }
  }, [status, session, router, callbackUrl]);

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

    const result = await signIn("credentials", {
        email,
        password,
        type: "password",
        role: "admin",
        redirect: false,
    });

    if (result?.error) {
        setError(result.error);
        setLoading(false);
    }
  };

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
        <div className="text-center mb-10 flex flex-col items-center">
            <ShieldCheck className="w-12 h-12 text-ink/80 mb-4" />
            <h1 className="text-3xl font-playfair font-bold tracking-tight mb-3">
                Admin Portal
            </h1>
            <p className="text-ink/40 text-[10px] uppercase tracking-[0.3em] font-medium">Restricted Access</p>
        </div>

        <div className="min-h-[220px]">
            <motion.form 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleAuth}
                className="space-y-4"
            >
                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-ink/40 ml-4 font-bold">Admin Email</label>
                    <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/20 group-focus-within:text-ink/60" />
                        <input 
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full h-14 bg-ink/5 border border-ink/5 rounded-2xl pl-14 pr-6 text-sm focus:outline-none focus:border-ink/20 focus:bg-ink/[0.07] transition-all"
                            placeholder="admin@example.com"
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
                {error && <p className="text-red-500 text-[10px] ml-4 font-bold uppercase tracking-wider">{error}</p>}
                <button 
                    disabled={loading}
                    className="w-full h-14 bg-ink text-canvas rounded-2xl text-sm font-bold tracking-widest uppercase mt-6 flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-ink/20 transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign In Securely"}
                    <ArrowRight className="w-4 h-4" />
                </button>
            </motion.form>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <ArtLoader variant="fullscreen" size="md" />
      </div>
    }>
      <AdminLoginContent />
    </Suspense>
  );
}
