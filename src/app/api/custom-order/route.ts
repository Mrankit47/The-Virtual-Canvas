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

interface StudioOrderBody {
  // Customer info
  customerName: string;
  email: string;
  phone: string;
  address: string;
  pincode: string;
  // Configuration IDs (we re-fetch from Sanity for validation)
  styleId: string;
  sizeId: string;
  paperId: string;
  // Client-side computed price (we verify against server computation)
  clientFinalPrice: number;
  // Optional
  notes?: string;
  referenceImageUrl?: string;
  couponCode?: string;
  discountAmount?: number;
}

export async function POST(req: Request) {
  try {
    if (!env.SANITY_API_WRITE_TOKEN) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session: any = await getServerSession(authOptions);
    const body: StudioOrderBody = await req.json();

    const { 
      customerName, email, phone, address, pincode,
      styleId, sizeId, paperId, 
      clientFinalPrice, notes, referenceImageUrl,
      couponCode, discountAmount 
    } = body;

    // ── Input Validation ──────────────────────────────────────────────────────
    if (!customerName?.trim() || !email?.trim() || !phone?.trim() || !address?.trim() || !pincode?.trim()) {
      return NextResponse.json({ error: 'Customer info (name, email, phone, address, pincode) is required' }, { status: 400 });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json({ error: 'Invalid 6-digit pincode' }, { status: 400 });
    }
    if (!styleId || !sizeId || !paperId) {
      return NextResponse.json({ error: 'All configurator selections (style, size, paper) are required' }, { status: 400 });
    }

    // ── Fetch Config Options from Sanity (SOURCE OF TRUTH) ───────────────────
    const [style, size, paper] = await Promise.all([
      backendClient.fetch(`*[_type == "artStyle" && _id == $id && isActive == true][0]{ _id, title, basePrice, requiresReference }`, { id: styleId }),
      backendClient.fetch(`*[_type == "sizeOption" && _id == $id && isActive == true][0]{ _id, label, multiplier }`, { id: sizeId }),
      backendClient.fetch(`*[_type == "paperType" && _id == $id && isActive == true][0]{ _id, title, extraCost }`, { id: paperId }),
    ]);

    if (!style) return NextResponse.json({ error: 'Selected art style is no longer available' }, { status: 404 });
    if (!size) return NextResponse.json({ error: 'Selected size is no longer available' }, { status: 404 });
    if (!paper) return NextResponse.json({ error: 'Selected paper type is no longer available' }, { status: 404 });

    // ── Reference Image Validation ────────────────────────────────────────────
    if (style.requiresReference && !referenceImageUrl?.trim()) {
      return NextResponse.json({ error: `"${style.title}" requires a reference image. Please upload one.` }, { status: 400 });
    }

    // ── ANTI-FRAUD: Re-compute price on server ────────────────────────────────
    const baseServerPrice = Math.round(style.basePrice * size.multiplier + paper.extraCost);
    let serverComputedPrice = baseServerPrice;

    // ── Server-Side Coupon Re-Validation ─────────────────────────────────────
    if (couponCode) {
      const coupon = await backendClient.fetch(
        `*[_type == "coupon" && code == $code && isActive == true][0]`,
        { code: couponCode.trim().toUpperCase() }
      );

      if (coupon && 
          (!coupon.expiry || new Date(coupon.expiry) >= new Date()) &&
          (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) &&
          (!coupon.minimumOrderAmount || baseServerPrice >= coupon.minimumOrderAmount)) {
        
        let calculatedDiscount = 0;
        if (coupon.type === 'percentage') {
          calculatedDiscount = Math.round((baseServerPrice * coupon.discount) / 100);
        } else {
          calculatedDiscount = Math.min(coupon.discount, baseServerPrice);
        }
        
        serverComputedPrice = Math.max(0, baseServerPrice - calculatedDiscount);
        
        // Verify discount amount matches client claim (within 1 Re rounding)
        if (discountAmount && Math.abs(calculatedDiscount - discountAmount) > 1) {
           console.error(`DISCOUNT FRAUD: client=${discountAmount}, server=${calculatedDiscount}`);
           return NextResponse.json({ error: 'Discount mismatch. Please retry.' }, { status: 400 });
        }
      } else if (couponCode) {
        return NextResponse.json({ error: 'Applied coupon is no longer valid.' }, { status: 400 });
      }
    }

    if (Math.abs(serverComputedPrice - clientFinalPrice) > 1) {
      console.error(`PRICE FRAUD: client=${clientFinalPrice}, server=${serverComputedPrice}`);
      return NextResponse.json({ error: 'Price mismatch. Please refresh and try again.' }, { status: 400 });
    }

    // ── Generate Order ID ─────────────────────────────────────────────────────
    const orderId = `TVC-STUDIO-${Math.floor(100 + Math.random() * 900)}-${Date.now().toString().slice(-5)}`;

    // Order expiry: 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // ── Create Sanity Order ───────────────────────────────────────────────────
    const newOrder = await backendClient.create({
      _type: 'order',
      orderId,
      orderType: 'studio',
      customerName,
      email,
      userEmail: session?.user?.email || email,
      phone,
      address,
      pincode,

      // Studio configuration snapshot (immutable record of what was ordered)
      artworkType: style.title,
      description: `Studio Order: ${style.title} — ${size.label} — ${paper.title}${notes ? `\n\nNotes: ${notes}` : ''}`,
      referenceImage: referenceImageUrl || undefined,

      // Pricing breakdown
      price: serverComputedPrice,
      totalAmount: serverComputedPrice,
      couponCode: couponCode || undefined,
      discountAmount: discountAmount || 0,

      // Cart-compatible fields
      cartItems: [{
        artworkId: styleId,
        title: `${style.title} (${size.label} / ${paper.title})`,
        price: serverComputedPrice,
        imageUrl: '',
      }],

      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // Studio-specific metadata stored in adminNotes
      adminNotes: JSON.stringify({
        styleId, styleName: style.title, basePrice: style.basePrice,
        sizeId, sizeLabel: size.label, sizeMultiplier: size.multiplier,
        paperId, paperTitle: paper.title, paperExtraCost: paper.extraCost,
        computedPrice: serverComputedPrice,
        expiresAt,
      }),
    });

    // ── Send Receipt Email (non-blocking) ─────────────────────────────────────
    try {
      await sendOrderReceipt({
        orderId: newOrder.orderId as string,
        customerName,
        artworkType: `${style.title} — ${size.label} — ${paper.title}`,
        price: serverComputedPrice,
        email,
        address,
        pincode,
      });
    } catch (emailErr) {
      console.error('Studio receipt email failed (non-critical):', emailErr);
    }

    return NextResponse.json({
      success: true,
      orderId: newOrder.orderId,
      totalAmount: serverComputedPrice,
      createdAt: newOrder.createdAt,
    });

  } catch (error: any) {
    console.error('Custom Order Error:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
