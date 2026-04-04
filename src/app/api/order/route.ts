import { NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import { env } from '@/config/env';
import { orderFormSchema } from '@/lib/validations/order';
import { sendOrderReceipt } from '@/lib/email/sendReceipt';

// Requirement 1 & 2: Validate Token explicitly before allowing client bindings
if (!env.SANITY_API_WRITE_TOKEN) {
  throw new Error("SANITY_API_WRITE_TOKEN is missing");
}

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    const body = await req.json();
    
    // Requirement: Hardened Zod API server-side validation boundary
    const parsed = orderFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing required configuration fields.' }, { status: 400 });
    }

    const { 
      customerName, email, phone, artworkType, 
      description, referenceImage, price, paymentProof,
      couponCode, discountAmount
    } = parsed.data;

    const orderId = `TVC-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-4)}`;

    const newOrder = await backendClient.create({
      _type: 'order',
      orderId,
      customerName,
      email,
      userEmail: session?.user?.email || email, // Link to session user if available
      phone,
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
    
    // Background Email Transmission
    await sendOrderReceipt({
      orderId: newOrder.orderId as string,
      customerName,
      artworkType,
      price,
      email,
    });

    return NextResponse.json({ 
      success: true, 
      orderId: newOrder.orderId,
      createdAt: newOrder.createdAt 
    });
  } catch (error: any) {
    // Requirement 3: Improved Diagnostic Log
    console.error("FULL ERROR:", error);
    
    // Requirement 6: Generic Safe Error message to client
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
