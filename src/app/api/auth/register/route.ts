import { NextResponse } from "next/server";
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import bcrypt from 'bcryptjs';
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rateLimit";

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
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
    const { success } = await limiter.check(5, ip);
    if (!success) {
      return rateLimitResponse(900);
    }

    let { name, email, mobile, password, type } = await request.json();

    // Strictly enforce role as 'user' for public registration
    const role = 'user';

    // 1. Validation
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    
    // Normalize email if present
    const normalizedEmail = email ? email.toLowerCase().trim() : null;

    if (type === 'email' && (!normalizedEmail || !password)) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (type === 'mobile' && !mobile) {
        return NextResponse.json({ error: "Mobile number is required" }, { status: 400 });
    }

    // 2. Check for Existing User (Safe check to skip null/undefined matches)
    const existingUser = await backendClient.fetch(
      `*[_type == "userProfile" && (
        (defined(email) && $email != null && email == $email) || 
        (defined(mobileNumber) && $mobile != null && mobileNumber == $mobile)
      )][0]`,
      { email: normalizedEmail, mobile: mobile || null }
    );

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email or mobile" }, { status: 400 });
    }

    // 3. Hash Password (if email signup)
    let hashedPassword = null;
    if (password) {
        const normalizedPassword = password.trim();
        hashedPassword = await bcrypt.hash(normalizedPassword, 12);
    }

    // 4. Create User Profile in Sanity
    const newUser = await backendClient.create({
      _type: "userProfile",
      name,
      email: normalizedEmail || undefined,
      mobileNumber: mobile || undefined,
      password: hashedPassword,
      role: role || "user",
    });

    return NextResponse.json({
      message: "Registration successful",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
