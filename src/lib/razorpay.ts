import Razorpay from 'razorpay';
import { env } from '@/config/env';
import crypto from 'crypto';

export const razorpay = new Razorpay({
  key_id: env.NEXT_PUBLIC_RAZORPAY_KEY || '',
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

  const isMatch = generatedSignature === signature;
  console.log(`🔍 Payment Verification: ${isMatch ? 'PASSED' : 'FAILED'}`);
  return isMatch;
}
