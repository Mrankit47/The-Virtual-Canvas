import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from "@/config/env";
import { razorpay } from "@/lib/razorpay";

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2024-03-22",
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await request.json();

  if (!orderId) {
    return NextResponse.json({ error: "Missing Order ID" }, { status: 400 });
  }

  try {
    // 1. Fetch Order and Verify Ownership
    const order = await backendClient.fetch(
        `*[_type == "order" && _id == $orderId][0]`,
        { orderId }
    );

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.userEmail !== session.user.email) {
        return NextResponse.json({ error: "This is not your order" }, { status: 403 });
    }

    // 2. Already Paid?
    if (order.paymentStatus === 'paid') {
        return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    const totalAmount = order.totalAmount || order.price;
    if (!totalAmount || isNaN(Number(totalAmount))) {
        return NextResponse.json({ error: "Invalid order amount on server" }, { status: 400 });
    }

    // 3. Create Razorpay Order
    console.log(`💳 Attempting to create Razorpay order for ${totalAmount} INR...`);
    
    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(Number(totalAmount) * 100), // in paise
        currency: "INR",
        receipt: order.orderId || order._id, // Fallback to _id if orderId field is missing
    });

    return NextResponse.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: order.orderId || order._id,
    });
  } catch (error: any) {
    console.error("❌ Razorpay Order Creation Detailed Error:", {
        message: error.message,
        stack: error.stack,
        ...error // Spread to catch other properties like 'error' from Razorpay SDK
    });

    const errorMessage = error.message || (error.error && error.error.description) || "Failed to create payment order";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
