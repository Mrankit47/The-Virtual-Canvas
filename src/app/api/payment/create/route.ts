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

    const amount = order.totalAmount || order.price;
    if (!amount) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    // 3. Create Razorpay Order
    const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // in paise
        currency: "INR",
        receipt: order.orderId,
    });

    return NextResponse.json({
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: order.orderId,
    });
  } catch (error: any) {
    console.error("Create Payment Error:", error.message);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}
