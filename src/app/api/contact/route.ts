import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { env } from '@/config/env';

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json();

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
      subject: `[Contact Inquiry] ${subject.toUpperCase()} - From ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #111; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; background-color: #fcfcfc;">
          <div style="text-align: center; margin-bottom: 40px;">
             <div style="display: inline-block; border: 1px solid #111; padding: 10px 15px; background: #111; color: #fff; font-family: Georgia, serif; letter-spacing: 2px;">TVC</div>
             <h2 style="font-family: Georgia, serif; text-transform: uppercase; letter-spacing: 4px; margin-top: 20px;">Direct Inquiry</h2>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
             <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; width: 30%; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Name</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; font-weight: bold;">${name}</td>
             </tr>
             <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Email</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee;">${email}</td>
             </tr>
             <tr>
                <td style="padding: 15px; border-bottom: 1px solid #eee; color: #999; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Subject</td>
                <td style="padding: 15px; border-bottom: 1px solid #eee; font-weight: bold; color: #111;">${subject}</td>
             </tr>
             <tr>
                <td colspan="2" style="padding: 30px 15px;">
                   <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin-bottom: 15px;">Message Content</p>
                   <div style="font-family: Georgia, serif; font-size: 16px; line-height: 1.8; color: #444; font-style: italic;">
                      "${message}"
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
    return NextResponse.json({ error: error.message || 'Transmission failed' }, { status: 500 });
  }
}
