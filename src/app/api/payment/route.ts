import Razorpay from "razorpay";
import { createClient } from '@sanity/client';
import { env } from '@/config/env';

// 3. Add at top of file:
export const dynamic = "force-dynamic";

// 4. Ensure correct App Router syntax:
export async function POST(req: Request) {
  try {
    // 5. Replace any req.body usage with:
    const { amount, orderId, couponCode } = await req.json();

    // 6. Use env validation:
    if (!env.NEXT_PUBLIC_RAZORPAY_KEY || !env.RAZORPAY_KEY_SECRET) {
        console.error("CRITICAL: Razorpay credentials missing");
        return Response.json({ success: false, error: "Server configuration error" }, { status: 500 });
    }

    // 1 & 2. Move initialization inside function:
    const backendClient = createClient({
      projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: env.NEXT_PUBLIC_SANITY_DATASET,
      apiVersion: '2024-03-22',
      useCdn: false,
      token: env.SANITY_API_WRITE_TOKEN,
    });

    const razorpay = new Razorpay({
      key_id: env.NEXT_PUBLIC_RAZORPAY_KEY,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    // Safety Layer: Double-Submit Protection
    const order = await backendClient.fetch(
      `*[_type == "order" && orderId == $orderId][0]`,
      { orderId }
    );

    if (!order) {
       return Response.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return Response.json({ success: false, error: "Order already paid" }, { status: 400 });
    }

    // ── RE-VALIDATE COUPON on server ──────────────────────────
    let serverTotal = order.price;
    let discountAmount = 0;

    // IMPORTANT: Cart orders are already discounted in api/cart-order.
    // Only apply coupon logic here for single-artwork orders that haven't been discounted yet.
    if (couponCode && order.orderType !== 'cart') {
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

        await backendClient.patch(order._id)
          .set({ couponCode: couponCode.trim().toUpperCase(), discountAmount, price: serverTotal })
          .commit();
      }
    }

    // Fraud check
    if (amount !== undefined && Math.abs(amount - serverTotal) > 1) {
      console.error(`FRAUD ATTEMPT: clientAmount=${amount}, serverTotal=${serverTotal}`);
      return Response.json({ success: false, error: 'Invalid payment amount. Please refresh and try again.' }, { status: 400 });
    }

    const options = {
      amount: serverTotal * 100, // Razorpay expects paise
      currency: "INR",
      receipt: orderId,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // 7 & 9. Return clean, production-ready Response
    return Response.json(razorpayOrder);
  } catch (error: any) {
    // 7. Wrap logic in try-catch
    console.error("❌ Razorpay Order Creation Detailed Error (Route):", {
        message: error.message,
        stack: error.stack,
        ...error
    });

    const errorMessage = error.message || (error.error && error.error.description) || "Failed to create payment order";
    return Response.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
