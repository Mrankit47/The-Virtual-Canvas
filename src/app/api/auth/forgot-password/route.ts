import { NextResponse } from "next/server";
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
        const { action, email, otp, password } = await request.json();

        if (action === 'send-otp') {
            if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
            const normalizedEmail = email.toLowerCase().trim();

            // Find user
            const user = await backendClient.fetch(
                `*[_type == "userProfile" && email == $email][0]`,
                { email: normalizedEmail }
            );

            if (!user) return NextResponse.json({ error: "No account found with this email" }, { status: 404 });

            // Generate OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

            await backendClient.patch(user._id).set({ otp: generatedOtp, otpExpiry: expiry }).commit();

            const sent = await sendOTPEmail(normalizedEmail, generatedOtp, "Password Reset");
            if (!sent) throw new Error("Failed to send OTP email");

            return NextResponse.json({ success: true, message: "OTP sent to your email" });
        }

        if (action === 'reset-password') {
            if (!email || !otp || !password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
            const normalizedEmail = email.toLowerCase().trim();

            const user = await backendClient.fetch(
                `*[_type == "userProfile" && email == $email][0]`,
                { email: normalizedEmail }
            );

            if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
            if (user.otp !== otp) return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
            if (new Date(user.otpExpiry) < new Date()) return NextResponse.json({ error: "OTP expired" }, { status: 400 });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password.trim(), salt);

            await backendClient.patch(user._id).set({
                password: hashedPassword,
                otp: null,
                otpExpiry: null
            }).commit();

            return NextResponse.json({ success: true, message: "Password reset successful. You can now login." });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
    }
}
