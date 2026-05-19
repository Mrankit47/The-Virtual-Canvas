import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { createClient } from '@sanity/client';
import { env } from "@/config/env";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { sendNotificationEmail } from "@/lib/email";
import { sendOrderReceipt } from "@/lib/email/sendReceipt";

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

    // Mark purchased artworks as out of stock dynamically
    try {
      if (order.orderType === 'cart' && order.cartItems && Array.isArray(order.cartItems)) {
        await Promise.all(order.cartItems.map(async (item: any) => {
          if (item.artworkId) {
            await backendClient.patch(item.artworkId).set({ isOutOfStock: true }).commit();
          }
        }));
      }
    } catch (stockErr) {
      console.error("Failed to mark artworks as out of stock post-payment:", stockErr);
    }

    // 4. Create Marketplace Sale Records (if applicable)
    if (order.orderType === 'cart' && order.cartItems && Array.isArray(order.cartItems)) {
        const artistItems = order.cartItems.filter((item: any) => item.artistId);
        
        if (artistItems.length > 0) {
            await Promise.all(artistItems.map(async (item: any) => {
                // Create Sale Record
                await backendClient.create({
                    _type: 'sale',
                    artwork: { _type: 'reference', _ref: item.artworkId },
                    artist: { _type: 'reference', _ref: item.artistId },
                    buyer: { _type: 'reference', _ref: session.user.id },
                    buyerEmail: session.user.email,
                    amount: item.price,
                    paymentId: razorpay_payment_id,
                    orderId: razorpay_order_id,
                    status: 'completed',
                    createdAt: new Date().toISOString(),
                });

                // Notify Artist
                await backendClient.create({
                    _type: 'notification',
                    userEmail: item.artistEmail || '', // Ideally we should have artist email, but let's at least create in-app for the ref artist
                    artist: { _type: 'reference', _ref: item.artistId },
                    message: `Congratulations! Your artwork "${item.title}" has been sold.`,
                    type: 'marketplace_sale',
                    read: false,
                });
            }));
        }
    }

    // 5. Trigger In-app and Email Notification for Buyer
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

    // Send Detailed Order Receipt Email on verified success
    try {
      let subtotal = order.price + (order.discountAmount || 0);
      let addPhotoFrame = false;
      let baseFramePrice = 0;
      let framePrice = 0;
      
      if (order.adminNotes) {
        try {
          const studioMeta = JSON.parse(order.adminNotes);
          if (studioMeta) {
            subtotal = Math.round(studioMeta.basePrice * studioMeta.sizeMultiplier + studioMeta.paperExtraCost);
            addPhotoFrame = !!studioMeta.addPhotoFrame;
            baseFramePrice = studioMeta.baseFramePrice || 0;
            framePrice = studioMeta.framePrice || 0;
          }
        } catch (e) {
          console.error("Failed to parse adminNotes for receipt email", e);
        }
      }

      await sendOrderReceipt({
        orderId: order.orderId,
        customerName: order.customerName,
        artworkType: order.artworkType || 'Commission Artwork',
        price: order.price,
        email: order.email,
        address: order.address,
        pincode: order.pincode,
        subtotal,
        discountAmount: order.discountAmount || 0,
        couponCode: order.couponCode,
        shippingCharges: order.shippingCharges,
        shippingZone: order.shippingZone,
        addPhotoFrame,
        baseFramePrice,
        framePrice,
      });
    } catch (receiptErr) {
      console.error("Failed to send post-payment verified receipt", receiptErr);
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error("Payment Verification Error:", error.message);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
