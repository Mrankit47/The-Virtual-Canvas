import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import { orderFormSchema } from '@/lib/validations/order';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import crypto from 'crypto';
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rateLimit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

// 4. Add Dynamic Rendering to prevent build-time static generation failures
export const dynamic = "force-dynamic";

// 1. Fix API Route Structure (Export async functions)
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = await limiter.check(10, ip);
    if (!success) {
      return rateLimitResponse(60);
    }

    const session: any = await getServerSession(authOptions);
    if (!session?.user) {
      return Response.json({ success: false, error: 'Authentication required. Please log in to place an order.' }, { status: 401 });
    }

    // 3. Prevent Build-Time Execution: Logic inside handler
    // 5. Fix Environment Variables: Check inside handler
    if (!env.SANITY_API_WRITE_TOKEN) {
        console.error("CRITICAL: SANITY_API_WRITE_TOKEN is missing");
        return Response.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    const backendClient = createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: '2024-03-22',
      useCdn: false,
      token: env.SANITY_API_WRITE_TOKEN,
    });
    
    // 2. Fix Request Handling: Use req.json()
    const body = await req.json();
    
    // Validate schema
    const parsed = orderFormSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ success: false, error: 'Missing required configuration fields.' }, { status: 400 });
    }

    const { 
      customerName, email, phone, address, pincode, 
      artworkType, description, referenceImage, price, 
      paymentProof, couponCode, discountAmount
    } = parsed.data;

    const orderId = `TVC-${crypto.randomInt(100, 1000)}-${Date.now().toString().slice(-4)}`;

    // 10. Optimize for Vercel: Perform DB operation
    const newOrder = await backendClient.create({
      _type: 'order',
      orderId,
      customerName,
      email,
      userEmail: session?.user?.email || email,
      phone,
      address,
      pincode,
      artworkType,
      description,
      price,
      referenceImage: referenceImage,
      paymentProof: paymentProof,
      artworkId: body.artworkId ? { _type: 'reference', _ref: body.artworkId } : undefined,
      couponCode: couponCode || undefined,
      discountAmount: discountAmount || 0,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 9. Return Valid Response
    return Response.json({ 
      success: true, 
      orderId: newOrder.orderId,
      createdAt: newOrder.createdAt 
    });
  } catch (error: any) {
    // 6. Add Proper Error Handling with try-catch
    console.error("API ORDER ERROR:", error);
    return Response.json({ success: false, error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
