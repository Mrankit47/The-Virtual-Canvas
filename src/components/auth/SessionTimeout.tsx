"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useUIStore } from "@/store/useUIStore";

const IDLE_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const WARNING_TIMEOUT = 9 * 60 * 1000; // 9 minutes (1 minute before logout)

export default function SessionTimeout() {
  const { data: session, status } = useSession();
  const { addToast } = useUIStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetRef = useRef<number>(0);

  const handleLogout = useCallback(() => {
    signOut({ callbackUrl: "/login?reason=idle" });
  }, []);

  const showWarning = useCallback(() => {
    addToast("Your session will expire in 1 minute due to inactivity.", "info");
  }, [addToast]);

  const resetTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    if (status === "authenticated") {
      warningTimerRef.current = setTimeout(showWarning, WARNING_TIMEOUT);
      timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
    }
  }, [status, handleLogout, showWarning]);

  useEffect(() => {
    const events = [
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "mousemove",
      "click",
    ];

    const handleActivity = () => {
      const now = Date.now();
      // Throttle: reset timers at most once every 5 seconds (5000ms)
      if (now - lastResetRef.current > 5000) {
        lastResetRef.current = now;
        resetTimers();
      }
    };

    if (status === "authenticated") {
      events.forEach((event) => window.addEventListener(event, handleActivity));
      resetTimers();
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [status, resetTimers]);

  return null; // This is a logic-only component
}
