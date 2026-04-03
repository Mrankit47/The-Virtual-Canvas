import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from 'next-sanity';
import bcrypt from 'bcryptjs';

const backendClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
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
                    const user = await backendClient.fetch(
                        `*[_type == "userProfile" && email == $email][0]`,
                        { email }
                    );

                    if (!user || !user.password) {
                        throw new Error("Invalid credentials or method");
                    }

                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) throw new Error("Invalid password");

                    // 1a. Role Enforcement
                    if (role && user.role !== role) {
                        throw new Error(`Your account does not have ${role} permissions.`);
                    }

                    return {
                        id: user._id,
                        name: user.name || user.email.split('@')[0],
                        email: user.email,
                        role: user.role || "user",
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

                    // 2a. Role Enforcement for Mobile Login
                    const user = await backendClient.fetch(
                        `*[_type == "userProfile" && mobileNumber == $cleanMobile][0]`,
                        { cleanMobile }
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
        async jwt({ token, user }: { token: any, user: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
        maxAge: 600, // 10 Minutes (in seconds)
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                // No maxAge here means it's a 'Session Cookie' 
                // which expires when the browser/tab is closed.
            }
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
