import { NextResponse } from "next/server";
import { createClient } from 'next-sanity';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(request: Request) {
  try {
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

    // 2. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // 3. Save OTP (If user exists, patch it. If not, we might need a temporary doc or just skip saving if we verify differently)
    // Actually, for registration OTP, we should probably save it in a temporary 'otpVerification' document or use a session-based approach.
    // For simplicity, I'll create a temporary document or use a fixed 'otpVerification' type.
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

    // 4. Mock SMS Send (Log to console)
    console.log(`\n--- [MOCK SMS] ---\nTO: ${mobile}\nOTP: ${otp}\n------------------\n`);

    return NextResponse.json({ message: "OTP sent successfully (Check terminal)" });
  } catch (error) {
    console.error("OTP Error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
