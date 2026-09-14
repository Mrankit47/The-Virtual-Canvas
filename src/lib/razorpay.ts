import Razorpay from 'razorpay';
import { env } from '@/config/env';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY || env.NEXT_PUBLIC_RAZORPAY_KEY || '',
  key_secret: env.RAZORPAY_KEY_SECRET || '',
});

export function verifyPaymentSignature(
  orderId: string, 
  paymentId: string, 
  signature: string
) {
  const secret = env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error('❌ Razorpay Secret is missing in verification');
    return false;
  }

  const text = `${orderId}|${paymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');

  try {
    const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
    const signatureBuffer = Buffer.from(signature, 'utf-8');
    if (generatedBuffer.length !== signatureBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
  } catch {
    return false;
  }
}
