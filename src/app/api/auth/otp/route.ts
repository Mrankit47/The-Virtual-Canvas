import { NextResponse } from "next/server";
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import crypto from 'crypto';
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rateLimit";

const limiter = rateLimit({
  interval: 5 * 60 * 1000, // 5 minutes
  uniqueTokenPerInterval: 500,
});

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const { success } = await limiter.check(3, ip);
    if (!success) {
      return rateLimitResponse(300);
    }

    const { mobile, mode } = await request.json(); // mode: 'login' or 'register'

    if (!mobile) {
      return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    // 1. Check if user exists (Safe search)
    const user = await backendClient.fetch(
      `*[_type == "userProfile" && defined(mobileNumber) && $mobile != null && mobileNumber == $mobile][0]`,
      { mobile: mobile || null }
    );

    if (mode === 'login' && !user) {
      return NextResponse.json({ error: "No user found with this mobile number" }, { status: 404 });
    }
    
    if (mode === 'register' && user) {
        return NextResponse.json({ error: "User already exists with this mobile number" }, { status: 400 });
    }

    // 2. Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // 3. Save OTP
    if (user) {
        await backendClient.patch(user._id).set({ otp, otpExpiry }).commit();
    } else {
        // Create or Update a temporary OTP record for registration
        await backendClient.createOrReplace({
            _id: `otp-reg-${mobile}`,
            _type: 'otpVerification',
            mobileNumber: mobile,
            otp,
            expiry: otpExpiry,
        });
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
