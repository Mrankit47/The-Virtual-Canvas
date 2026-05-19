import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendOrderReceipt } from '@/lib/email/sendReceipt';
import { calculateShipping } from '@/lib/shipping';

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
  addPhotoFrame?: boolean;
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
      couponCode, discountAmount, addPhotoFrame 
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
      backendClient.fetch(`*[_type == "sizeOption" && _id == $id && isActive == true][0]{ _id, label, multiplier, framePrice }`, { id: sizeId }),
      backendClient.fetch(`*[_type == "paperType" && _id == $id && isActive == true][0]{ _id, title, extraCost }`, { id: paperId }),
    ]);

    if (!style) return NextResponse.json({ error: 'Selected art style is no longer available' }, { status: 404 });
    if (!size) return NextResponse.json({ error: 'Selected size is no longer available' }, { status: 404 });
    if (!paper) return NextResponse.json({ error: 'Selected paper type is no longer available' }, { status: 404 });

    // ── Reference Image Validation ────────────────────────────────────────────
    if (style.requiresReference && !referenceImageUrl?.trim()) {
      return NextResponse.json({ error: `"${style.title}" requires a reference image. Please upload one.` }, { status: 400 });
    }

    // Helper to dynamically resolve photo frame price based on size
    const getFramePrice = (sz: any) => {
      if (!sz) return 0;
      if (sz.framePrice !== undefined && sz.framePrice !== null) return sz.framePrice;
      const label = sz.label.toUpperCase();
      if (label.includes('A5')) return 150;
      if (label.includes('A4')) return 200;
      if (label.includes('A3')) return 250;
      return 0;
    };

    // ── Fetch and Validate Coupon First (If Applied) ─────────────────────────
    let coupon: any = null;
    if (couponCode) {
      coupon = await backendClient.fetch(
        `*[_type == "coupon" && code == $code && isActive == true][0]`,
        { code: couponCode.trim().toUpperCase() }
      );
      if (!coupon) {
        return NextResponse.json({ error: 'Applied coupon is no longer valid.' }, { status: 400 });
      }
      
      if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
        return NextResponse.json({ error: 'Applied coupon has expired.' }, { status: 400 });
      }
      
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Applied coupon usage limit reached.' }, { status: 400 });
      }
    }

    const freeFrameSecured = Boolean(coupon?.freeFrame);
    const freeDeliverySecured = Boolean(coupon?.freeDelivery);

    const baseFramePrice = addPhotoFrame ? getFramePrice(size) : 0;
    const finalFramePrice = freeFrameSecured ? 0 : baseFramePrice;

    // Subtotal (includes paper extra cost + frame cost if not free by coupon)
    const baseServerPrice = Math.round(style.basePrice * size.multiplier + paper.extraCost + finalFramePrice);

    if (coupon && coupon.minimumOrderAmount && baseServerPrice < coupon.minimumOrderAmount) {
      return NextResponse.json({ error: `Minimum order amount of ₹${coupon.minimumOrderAmount} required.` }, { status: 400 });
    }

    // ── Server-Side Shipping Charges Calculation ──────────────────────────────
    let shippingCharges = 0;
    let shippingZoneName = '';
    try {
      const shippingResult = await calculateShipping(pincode, baseServerPrice);
      shippingCharges = freeDeliverySecured ? 0 : shippingResult.rate;
      shippingZoneName = shippingResult.zoneName;
    } catch (err: any) {
      return NextResponse.json({ error: 'Failed to calculate shipping charges. Invalid pincode.' }, { status: 400 });
    }

    // ── Server-Side Coupon Re-Validation ─────────────────────────────────────
    let calculatedDiscount = 0;
    if (coupon) {
      if (coupon.type === 'percentage') {
        calculatedDiscount = Math.round((baseServerPrice * coupon.discount) / 100);
      } else {
        calculatedDiscount = Math.min(coupon.discount, baseServerPrice);
      }
      
      // Verify discount amount matches client claim (within 1 Re rounding)
      if (discountAmount && Math.abs(calculatedDiscount - discountAmount) > 1) {
         console.error(`DISCOUNT FRAUD: client=${discountAmount}, server=${calculatedDiscount}`);
         return NextResponse.json({ error: 'Discount mismatch. Please retry.' }, { status: 400 });
      }
    }

    const serverComputedPrice = Math.max(0, baseServerPrice - calculatedDiscount) + shippingCharges;

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
      description: `Studio Order: ${style.title} — ${size.label} — ${paper.title}${addPhotoFrame ? ' — With Premium Wooden Photo Frame' : ''}${notes ? `\n\nNotes: ${notes}` : ''}`,
      referenceImage: referenceImageUrl || undefined,

      // Pricing breakdown
      price: serverComputedPrice,
      totalAmount: serverComputedPrice,
      couponCode: couponCode || undefined,
      discountAmount: discountAmount || 0,
      shippingCharges: shippingCharges,
      shippingZone: shippingZoneName,

      // Cart-compatible fields
      cartItems: [{
        artworkId: styleId,
        title: `${style.title} (${size.label} / ${paper.title})${addPhotoFrame ? ' + Frame' : ''}`,
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
        addPhotoFrame: !!addPhotoFrame,
        baseFramePrice,
        framePrice: finalFramePrice,
        shippingCharges,
        shippingZone: shippingZoneName,
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
        subtotal: Math.round(style.basePrice * size.multiplier + paper.extraCost),
        discountAmount: calculatedDiscount,
        couponCode: couponCode || undefined,
        shippingCharges: shippingCharges,
        shippingZone: shippingZoneName,
        addPhotoFrame: !!addPhotoFrame,
        baseFramePrice,
        framePrice: finalFramePrice,
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
