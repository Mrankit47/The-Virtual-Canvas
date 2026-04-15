import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderReceipt } from '@/lib/email/sendReceipt';

// Token is validated inside the handler — not at module level
const backendClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface CartItemRequest {
  artworkId: string;
  title: string;
  price: number;
  imageUrl: string;
}

export async function POST(req: Request) {
  try {
    if (!env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session: any = await getServerSession(authOptions);
    const body = await req.json();

    const { customerName, email, phone, address, pincode, items, clientTotal, couponCode } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (!customerName || !email || !phone || !address || !pincode) {
      return NextResponse.json({ error: 'Customer info and shipping details are required' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // ── ANTI-FRAUD: Re-calculate total on server ───────────────────────────────
    // Never trust the client's total
    const serverSubtotal = items.reduce((sum: number, item: CartItemRequest) => sum + (item.price || 0), 0);

    // ── RE-VALIDATE COUPON on server ──────────────────────────────────────────
    let discountAmount = 0;
    let couponData: any = null;

    if (couponCode) {
      couponData = await backendClient.fetch(
        `*[_type == "coupon" && code == $code][0]`,
        { code: couponCode.trim().toUpperCase() }
      );

      if (couponData && couponData.isActive && new Date(couponData.expiry) >= new Date() &&
          (!couponData.usageLimit || couponData.usedCount < couponData.usageLimit)) {
        if (couponData.type === 'percentage') {
          discountAmount = Math.round((serverSubtotal * couponData.discount) / 100);
        } else if (couponData.type === 'flat') {
          discountAmount = Math.min(couponData.discount, serverSubtotal);
        }
      }
    }

    const serverTotal = Math.max(0, serverSubtotal - discountAmount);

    // Fraud check — client total must match server total within ±1 rupee (floating point tolerance)
    if (clientTotal !== undefined && Math.abs(clientTotal - serverTotal) > 1) {
      console.error(`FRAUD ATTEMPT: clientTotal=${clientTotal}, serverTotal=${serverTotal}`);
      return NextResponse.json({ error: 'Invalid order total. Please refresh and try again.' }, { status: 400 });
    }

    // ── DUPLICATE PURCHASE PROTECTION ────────────────────────────────────────
    // Check if any artwork in the cart has already been purchased (paid)
    const artworkIds = items.map((i: CartItemRequest) => i.artworkId);
    const alreadyPurchased: any[] = await backendClient.fetch(
      `*[_type == "order" && paymentStatus == "paid" && artworkId._ref in $ids] { artworkId }`,
      { ids: artworkIds }
    );

    if (alreadyPurchased.length > 0) {
      return NextResponse.json({
        error: 'One or more artworks in your cart have already been sold. Please remove them.',
      }, { status: 409 });
    }

    // ── Create Order in Sanity ────────────────────────────────────────────────
    const orderId = `TVC-CART-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-5)}`;

    const newOrder = await backendClient.create({
      _type: 'order',
      orderId,
      orderType: 'cart',
      customerName,
      email,
      userEmail: session?.user?.email || email,
      phone,
      address,
      pincode,

      // Cart-specific fields
      cartItems: items,
      totalAmount: serverTotal,
      couponCode: couponCode || undefined,
      discountAmount: discountAmount || undefined,

      // Required order fields (sensible defaults for cart orders)
      artworkType: 'digital',
      description: `Cart purchase: ${items.map((i: CartItemRequest) => i.title).join(', ')}`,
      price: serverTotal,

      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // ── Send Receipt Email ────────────────────────────────────────────────────
    try {
      await sendOrderReceipt({
        orderId: newOrder.orderId as string,
        customerName,
        artworkType: `${items.length} artwork${items.length > 1 ? 's' : ''}`,
        price: serverTotal,
        email,
        address,
        pincode,
      });
    } catch (emailErr) {
      console.error('Receipt email failed (non-critical):', emailErr);
    }

    return NextResponse.json({
      success: true,
      orderId: newOrder.orderId,
      totalAmount: serverTotal,
      discountAmount,
      createdAt: newOrder.createdAt,
    });

  } catch (error: any) {
    console.error('Cart Order Error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
