import { NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { env } from '@/config/env';

const readClient = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-22',
  useCdn: false,
});

export async function POST(req: Request) {
  try {
    const { code, total, framePrice = 0 } = await req.json();

    if (!code || typeof code !== 'string' || !total || typeof total !== 'number') {
      return NextResponse.json({ valid: false, message: 'Invalid request' }, { status: 400 });
    }

    // Server-side fetch — never trust client coupon data
    const coupon = await readClient.fetch(
      `*[_type == "coupon" && code == $code][0]`,
      { code: code.trim().toUpperCase() }
    );

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Coupon not found' }, { status: 200 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ valid: false, message: 'Coupon is no longer active' }, { status: 200 });
    }

    // Expiry check
    if (coupon.expiry && new Date(coupon.expiry) < new Date()) {
      return NextResponse.json({ valid: false, message: 'Coupon has expired' }, { status: 200 });
    }

    // Usage limit check
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ valid: false, message: 'Coupon usage limit reached' }, { status: 200 });
    }

    // Subtract frame price from subtotal if the coupon grants a free frame
    const subtotalForDiscount = coupon.freeFrame ? Math.max(0, total - framePrice) : total;

    // Minimum order amount check (validated against the original total before frame discounts)
    if (coupon.minimumOrderAmount && total < coupon.minimumOrderAmount) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order amount of ₹${coupon.minimumOrderAmount} required`,
      }, { status: 200 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.round((subtotalForDiscount * coupon.discount) / 100);
    } else if (coupon.type === 'flat') {
      discountAmount = Math.min(coupon.discount, subtotalForDiscount); // Can't discount more than subtotal
    }

    const discountedTotal = Math.max(0, subtotalForDiscount - discountAmount);

    const benefits = [];
    if (coupon.discount > 0) {
      benefits.push(coupon.type === 'percentage' ? `${coupon.discount}% off` : `₹${coupon.discount} off`);
    }
    if (coupon.freeDelivery) {
      benefits.push('Free Shipping 🚚');
    }
    if (coupon.freeFrame) {
      benefits.push('Free Premium Frame 🖼️');
    }
    const benefitsText = benefits.length > 0 ? benefits.join(' & ') : 'Discount applied';

    return NextResponse.json({
      valid: true,
      discountAmount,
      discountedTotal,
      couponType: coupon.type,
      couponDiscount: coupon.discount,
      freeDelivery: Boolean(coupon.freeDelivery),
      freeFrame: Boolean(coupon.freeFrame),
      message: `${benefitsText} successfully applied!`,
    });

  } catch (error: any) {
    console.error('Coupon Validation Error:', error);
    return NextResponse.json({ valid: false, message: 'Server error during validation' }, { status: 500 });
  }
}
