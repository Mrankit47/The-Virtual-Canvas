import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from "@/config/env";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendNotificationEmail } from "@/lib/email";

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

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id, orderId } = await request.json();
  const idToUse = order_id || orderId;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !idToUse) {
    return NextResponse.json({ error: "Missing verification details" }, { status: 400 });
  }

  try {
    // 1. Verify Signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });

    // 2. Fetch Order (Try by _id first, then by orderId)
    let order = await backendClient.fetch(
        `*[_type == "order" && (_id == $idToUse || orderId == $idToUse)][0]`,
        { idToUse }
    );

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    
    // Ownership check
    if (order.userEmail !== session.user.email) {
        return NextResponse.json({ error: "This is not your order" }, { status: 403 });
    }

    // 3. Update Order Payment Status
    const updatedOrder = await backendClient
      .patch(order._id) // Use the real Sanity _id
      .set({
        paymentStatus: 'paid',
        orderStatus: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        paidAt: new Date().toISOString(),
      })
      .commit();

    // 4. Trigger In-app and Email Notification
    await Promise.all([
        backendClient.create({
            _type: 'notification',
            userEmail: session.user.email,
            message: `Your payment for order #${order.orderId} was successful!`,
            type: 'payment_success',
            orderId: order.orderId,
            linkedOrderId: order_id,
            read: false,
        }),
        sendNotificationEmail(session.user.email, 'payment_success', order.orderId)
    ]);

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Payment Verification Error:", error.message);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
