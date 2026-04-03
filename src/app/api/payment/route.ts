import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createClient } from 'next-sanity';
import { env } from '@/config/env';

const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { amount, orderId } = await req.json();

    // Safety Layer: Double-Submit Protection
    const order = await backendClient.fetch(
      `*[_type == "order" && orderId == $orderId][0]`,
      { orderId }
    );

    if (!order) {
       return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 400 });
    }

    const options = {
      amount: amount * 100, // Razorpay expects paise
      currency: "INR",
      receipt: orderId,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    return NextResponse.json(razorpayOrder);
  } catch (error: any) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
