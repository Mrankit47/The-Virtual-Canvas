import { client } from "@/sanity/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { mobile, mode } = await req.json();

        // Check if user exists with this mobile number (Safe check)
        const user = await client.fetch(
            `*[_type == "userProfile" && defined(mobileNumber) && $mobile != null && mobileNumber == $mobile][0]`,
            { mobile: mobile || null }
        );

        if (mode === 'login' && !user) {
            return NextResponse.json({ error: "User not found. Please sign up first." }, { status: 404 });
        }

        if (mode === 'register' && user) {
            return NextResponse.json({ error: "User already registered. Please login." }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
