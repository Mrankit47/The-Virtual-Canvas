import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import { sendOTPEmail } from "@/lib/email";
import bcrypt from 'bcryptjs';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, name, email, mobile, password, otp, image, targetField } = await request.json();
    const userId = session.user.id;

    // ─── ACTION: SEND OTP ──────────────────────────────────────────────────
    if (action === 'send-otp') {
        if (!targetField) return NextResponse.json({ error: "Target field required" }, { status: 400 });
        
        // Generate 6-digit OTP
        const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins

        // Save OTP to user profile
        await backendClient.patch(userId).set({ otp: generatedOtp, otpExpiry: expiry }).commit();

        // Send OTP to registered email
        const sent = await sendOTPEmail(session.user.email, generatedOtp, targetField);
        if (!sent) throw new Error("Failed to send OTP email");

        return NextResponse.json({ success: true, message: "OTP sent to your registered email" });
    }

    // ─── ACTION: VERIFY & UPDATE (Sensitive Fields) ─────────────────────────
    if (action === 'verify-update') {
        if (!otp) return NextResponse.json({ error: "OTP is required" }, { status: 400 });

        // Fetch user to verify OTP
        const user = await backendClient.fetch(`*[_type == "userProfile" && _id == $userId][0]`, { userId });
        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        if (user.otp !== otp) return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
        if (new Date(user.otpExpiry) < new Date()) return NextResponse.json({ error: "OTP expired" }, { status: 400 });

        const updateData: any = { otp: null, otpExpiry: null }; // Clear OTP after use

        if (email) updateData.email = email.toLowerCase().trim();
        if (mobile) updateData.mobileNumber = mobile.trim();
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(password.trim(), salt);
        }

        await backendClient.patch(userId).set(updateData).commit();

        return NextResponse.json({ 
            success: true, 
            message: `${Object.keys(updateData).filter(k => k !== 'otp' && k !== 'otpExpiry').join(', ')} updated successfully` 
        });
    }

    // ─── DEFAULT ACTION: DIRECT UPDATE (Non-sensitive: Name, Image) ──────────
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (image) updateData.image = image;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No changes provided or invalid action" }, { status: 400 });
    }

    await backendClient.patch(userId).set(updateData).commit();

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      updatedFields: updateData
    });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
