import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { createClient } from '@sanity/client';
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
    const { amount, orderId, couponCode } = await req.json();

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

    // ── RE-VALIDATE COUPON on server (if provided) ──────────────────────────
    let serverTotal = order.price;
    let discountAmount = 0;

    if (couponCode) {
      const couponData = await backendClient.fetch(
        `*[_type == "coupon" && code == $code][0]`,
        { code: couponCode.trim().toUpperCase() }
      );

      if (couponData && couponData.isActive && new Date(couponData.expiry) >= new Date() &&
          (!couponData.usageLimit || couponData.usedCount < couponData.usageLimit)) {
        if (couponData.type === 'percentage') {
          discountAmount = Math.round((order.price * couponData.discount) / 100);
        } else if (couponData.type === 'flat') {
          discountAmount = Math.min(couponData.discount, order.price);
        }
        serverTotal = Math.max(0, order.price - discountAmount);

        // Update the order in Sanity with coupon info if it's new
        await backendClient.patch(order._id)
          .set({ couponCode: couponCode.trim().toUpperCase(), discountAmount, price: serverTotal })
          .commit();
      }
    }

    // Fraud check — client amount must match server total
    if (amount !== undefined && Math.abs(amount - serverTotal) > 1) {
      console.error(`FRAUD ATTEMPT: clientAmount=${amount}, serverTotal=${serverTotal}`);
      return NextResponse.json({ error: 'Invalid payment amount. Please refresh and try again.' }, { status: 400 });
    }

    const options = {
      amount: serverTotal * 100, // Razorpay expects paise
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
