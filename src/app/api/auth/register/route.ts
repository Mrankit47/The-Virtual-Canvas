import { NextResponse } from "next/server";
import { createClient } from 'next-sanity';
import { env } from '@/config/env';
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
    let { name, email, mobile, password, role, type } = await request.json();

    // Default to 'user' if not provided, and strictly prevent 'admin' from public signup
    if (!role || role === 'admin') {
        role = 'user';
    }

    // 1. Validation
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (type === 'email' && (!email || !password)) {
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
      { email: email || null, mobile: mobile || null }
    );

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email or mobile" }, { status: 400 });
    }

    // 3. Hash Password (if email signup)
    let hashedPassword = null;
    if (password) {
        hashedPassword = await bcrypt.hash(password, 12);
    }

    // 4. Create User Profile in Sanity
    const newUser = await backendClient.create({
      _type: "userProfile",
      name,
      email: email || undefined,
      mobileNumber: mobile || undefined,
      password: hashedPassword,
      role: role || "user",
    });

    return NextResponse.json({ message: "Registration successful", user: newUser });
  } catch (error) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
