import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from '@sanity/client';
import { env } from "@/config/env";
import bcrypt from 'bcryptjs';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: "credentials",
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                mobile: { label: "Mobile", type: "text" },
                otp: { label: "OTP", type: "text" },
                type: { label: "Type", type: "text" },
                role: { label: "Role", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials) return null;
                const { email, password, type, mobile, otp, role } = credentials;

                // 1. Handle Email/Password Login
                if (type === "password" && email && password) {
                    const normalizedEmail = email.toLowerCase().trim();
                    console.log(`[Auth] Attempting login for: ${normalizedEmail} with role: ${role}`);

                    const user = await backendClient.fetch(
                        `*[_type == "userProfile" && email == $email][0]`,
                        { email: normalizedEmail }
                    );

                    if (!user) {
                        console.error(`[Auth] User not found: ${normalizedEmail}`);
                        throw new Error("Invalid credentials or method");
                    }

                    if (!user.password) {
                        console.error(`[Auth] User found but has no password (maybe Google login?): ${normalizedEmail}`);
                        throw new Error("Invalid credentials or method");
                    }

                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) {
                        console.error(`[Auth] Password mismatch for: ${normalizedEmail}`);
                        throw new Error("Invalid password");
                    }

                    // 1a. Role Enforcement
                    if (role && user.role !== role) {
                        console.error(`[Auth] Role mismatch for ${normalizedEmail}. Expected: ${role}, Found: ${user.role}`);
                        throw new Error(`Your account does not have ${role} permissions.`);
                    }

                    console.log(`[Auth] Login successful for: ${normalizedEmail} (Role: ${user.role})`);

                    return {
                        id: user._id,
                        name: user.name || normalizedEmail.split('@')[0],
                        email: user.email,
                        role: user.role || "user",
                        mobile: user.mobileNumber || "",
                        image: user.image || "",
                    };
                }

                // 2. Handle Custom OTP Login (Fast2SMS)
                if (type === "otp" && mobile && otp) {
                    const cleanMobile = mobile.replace(/^\+91/, '');

                    // Verify OTP from Sanity
                    const otpData = await backendClient.fetch(
                        `*[_type == "otpVerification" && mobileNumber == $cleanMobile][0]`,
                        { cleanMobile }
                    );

                    if (!otpData) throw new Error("OTP not found. Please resend.");
                    if (otpData.otp !== otp) throw new Error("Invalid OTP code.");

                    const isExpired = new Date(otpData.expiry) < new Date();
                    if (isExpired) throw new Error("OTP expired. Please resend.");

                    // 2a. Role Enforcement for Mobile Login (Flexible match)
                    const user = await backendClient.fetch(
                        `*[_type == "userProfile" && (mobileNumber == $cleanMobile || mobileNumber == $fullMobile)][0]`,
                        { cleanMobile, fullMobile: `+91${cleanMobile}` }
                    );

                    if (user && role && user.role !== role) {
                        throw new Error(`Your account does not have ${role} permissions.`);
                    }

                    if (!user) {
                        // Temporary session for registration
                        return { 
                            id: "verify-only", 
                            name: "New User", 
                            email: cleanMobile, 
                            role: "user" 
                        };
                    }

                    return {
                        id: user._id,
                        name: user.name || cleanMobile,
                        email: user.email || cleanMobile,
                        role: user.role || "user",
                        mobile: user.mobileNumber || "",
                        image: user.image || "",
                    };
                }

                return null;
            }
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_ID!,
            clientSecret: process.env.GOOGLE_SECRET!,
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }: { token: any, user: any, trigger?: string, session?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.mobile = user.mobile;
                token.image = user.image;
            }
            // Allow manual session updates from frontend
            if (trigger === "update" && session) {
                token.name = session.name || token.name;
                token.mobile = session.mobile || token.mobile;
                token.image = session.image || token.image;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
                (session.user as any).mobile = token.mobile;
                (session.user as any).image = token.image;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 86400, // 24 Hours (in seconds)
    },
    secret: env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET,
};
