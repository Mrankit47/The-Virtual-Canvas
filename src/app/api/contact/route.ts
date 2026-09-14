import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/security/rateLimit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = await limiter.check(2, ip);
    if (!success) {
      return rateLimitResponse(60);
    }

    const { name, email, subject, message } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: 'Valid name is required (max 100 chars)' }, { status: 400 });
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0 || subject.length > 200) {
      return NextResponse.json({ error: 'Valid subject is required (max 200 chars)' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
      return NextResponse.json({ error: 'Valid message is required (max 2000 chars)' }, { status: 400 });
    }

    const safeName = escapeHtml(name.trim());
    const safeEmail = escapeHtml(email.trim());
    const safeSubject = escapeHtml(subject.trim());
    const safeMessage = escapeHtml(message.trim());

    const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = env;

    if (!EMAIL_USER || !EMAIL_PASS) {
      console.error('❌ [Email Error] Missing credentials for contact form');
      return NextResponse.json({ error: 'Mail server unconfigured' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const targetEmail = 'thevirtualcanvas.tvc@gmail.com';

    const mailOptions = {
      from: `"TVC Contact System" <${EMAIL_USER}>`,
      to: targetEmail,
      subject: `[Contact Inquiry] ${safeSubject.toUpperCase()} - From ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #111; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; background-color: #fcfcfc;">
          <div style="text-align: center; margin-bottom: 40px;">
             <div style="display: inline-block; border: 1px solid #111; padding: 10px 15px; background: #111; color: #fff; font-family: Georgia, serif; letter-spacing: 2px;">TVC</div>
             <h2 style="font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 4px; margin-top: 20px;">Direct Inquiry</h2>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
             <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; width: 30%; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Name</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; font-weight: bold;">${safeName}</td>
             </tr>
             <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Email</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">${safeEmail}</td>
             </tr>
             <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Subject</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; font-weight: bold; color: #111;">${safeSubject}</td>
             </tr>
             <tr>
                <td colspan="2" style="padding: 30px 15px;">
                   <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 15px;">Message Content</p>
                   <div style="font-family: Georgia, serif; font-size: 16px; line-height: 1.8; color: #444;">
                      ${safeMessage}
                   </div>
                </td>
             </tr>
          </table>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
          
          <p style="font-size: 9px; text-align: center; color: #aaa; text-transform: uppercase; letter-spacing: 3px;">This message was transmitted securely via thevirtualcanvas.com</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Message transmitted successfully' });
  } catch (error: any) {
    console.error('Email transmission dropped:', error);
    return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
  }
}
