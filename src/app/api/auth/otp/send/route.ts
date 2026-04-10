import { createClient } from 'next-sanity';
import { NextResponse } from "next/server";

const backendClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

export async function POST(req: Request) {
    try {
        const { mobile, mode } = await req.json();

        if (!mobile || !/^\d{10}$/.test(mobile.replace(/^\+91/, ''))) {
            return NextResponse.json({ error: "Invalid 10-digit mobile number" }, { status: 400 });
        }

        const cleanMobile = mobile.replace(/^\+91/, '');

        // 1. Check User in Sanity (flexible match)
        const user = await backendClient.fetch(
            `*[_type == "userProfile" && (mobileNumber == $cleanMobile || mobileNumber == $fullMobile)][0]`,
            { cleanMobile, fullMobile: `+91${cleanMobile}` }
        );

        if (mode === 'login' && !user) {
            return NextResponse.json({ error: "Mobile number not available" }, { status: 404 });
        }

        if (mode === 'register' && user) {
            return NextResponse.json({ error: "User already registered. Please login." }, { status: 400 });
        }

        // 2. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

        if (process.env.MOCK_OTP === 'true') {
            console.log("\n------------------------------");
            console.log(`🚀 MOCK OTP for ${cleanMobile}: ${otp}`);
            console.log("------------------------------\n");
        } else {
            // 3. Send SMS via Fast2SMS (Using Quick SMS route)
            const fast2smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
                method: "POST",
                headers: {
                    "authorization": process.env.FAST2SMS_API_KEY || "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    route: "q",
                    message: `Your OTP for The Virtual Canvas is ${otp}. Valid for 5 minutes.`,
                    numbers: cleanMobile,
                }),
            });

            const fast2smsData = await fast2smsRes.json();
            
            if (!fast2smsData.return) {
                console.error("Fast2SMS Error:", fast2smsData);
                return NextResponse.json({ error: "Failed to send SMS. Please try again later." }, { status: 500 });
            }
        }

        // 4. Save/Update OTP in Sanity
        await backendClient.delete({ query: `*[_type == "otpVerification" && mobileNumber == $cleanMobile]`, params: { cleanMobile } });

        await backendClient.create({
            _type: 'otpVerification',
            mobileNumber: cleanMobile,
            otp: otp,
            expiry: expiry,
        });

        return NextResponse.json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
        console.error("OTP Send Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
