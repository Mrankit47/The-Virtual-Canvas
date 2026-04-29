import nodemailer from 'nodemailer';
import { env } from '@/config/env';

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_PORT === 465,
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export type NotificationType = 
  | 'order_created' 
  | 'payment_success' 
  | 'assigned' 
  | 'progress' 
  | 'completed'
  | 'otp';

export async function sendNotificationEmail(
  to: string, 
  type: NotificationType, 
  orderId: string,
  extraData?: { artistName?: string; note?: string; progress?: number }
) {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials missing. Skipping email notification.');
    return;
  }

  const subjects: Record<NotificationType, string> = {
    order_created: `Artwork Request Received: #${orderId}`,
    payment_success: `Payment Confirmed: #${orderId}`,
    assigned: `Artist Assigned to Your Request: #${orderId}`,
    progress: `Artwork Progress Update: #${orderId}`,
    completed: `Your Artwork is Ready! #${orderId}`,
    otp: `Your One-Time Password (OTP) - The Virtual Canvas`,
  };

  const getContent = (type: NotificationType) => {
    switch (type) {
      case 'order_created':
        return `We have received your artwork commission request. Thank you for choosing The Virtual Canvas. Our administrators are reviewing it and will assign a creator shortly.`;
      case 'payment_success':
        return `Your payment for order #${orderId} has been successfully verified. We are now preparing to assign one of our elite artists to your request.`;
      case 'assigned':
        return `Great news! Artist ${extraData?.artistName || 'a professional creator'} has been assigned to your commission. You will receive updates as the work progresses.`;
      case 'progress':
        return `Latest Update from your Artist: "${extraData?.note || 'Work in progress'}" (Current Completion: ${extraData?.progress || 0}%)`;
      case 'completed':
        return `Exciting news! Your custom artwork #${orderId} has been completed. You can now view and download the final masterpiece on your dashboard.`;
      default:
        return 'There is a new update regarding your order.';
    }
  };

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
        <h1 style="font-family: serif; font-size: 24px; color: #1a1a1a; margin-bottom: 20px;">The Virtual Canvas</h1>
        <p style="font-size: 14px; color: #4a4a4a; line-height: 1.6;">${getContent(type)}</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
            <p style="font-size: 12px; color: #9a9a9a; text-transform: uppercase; letter-spacing: 1px;">Order ID: #${orderId}</p>
        </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"The Virtual Canvas" <${env.EMAIL_USER}>`,
      to,
      subject: subjects[type],
      html,
    });
    console.log(`✅ [Email Success] Sent to ${to} for event: ${type}. MessageId: ${info.messageId}`);
  } catch (error: any) {
    console.error(`❌ [Email Error] Failed to send ${type} email to ${to}:`, error.message);
  }
}

export async function sendOTPEmail(to: string, otp: string, action: string) {
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    console.warn('⚠️ Email credentials missing. Skipping OTP email.');
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
        <h1 style="font-family: serif; font-size: 24px; color: #1a1a1a; margin-bottom: 20px;">Profile Update Request</h1>
        <p style="font-size: 14px; color: #4a4a4a; line-height: 1.6;">You requested to update your <strong>${action}</strong>. Please use the following code to verify your identity:</p>
        <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; text-align: center; border-radius: 12px;">
            <h2 style="font-size: 32px; letter-spacing: 10px; margin: 0; color: #000;">${otp}</h2>
        </div>
        <p style="font-size: 12px; color: #9a9a9a;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f0f0f0;">
            <p style="font-size: 10px; color: #9a9a9a; text-transform: uppercase; letter-spacing: 1px;">The Virtual Canvas Secure Verification</p>
        </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"The Virtual Canvas" <${env.EMAIL_USER}>`,
      to,
      subject: `Verification Code: ${otp}`,
      html,
    });
    console.log(`✅ [OTP Email Success] Sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [OTP Email Error] Failed to send OTP to ${to}:`, error.message);
    return false;
  }
}
