import nodemailer from 'nodemailer';
import { env } from '@/config/env';

interface ReceiptData {
  orderId: string;
  customerName: string;
  artworkType: string;
  price: number;
  email: string;
  address?: string;
  pincode?: string;
  
  // Dynamic Billing Fields
  subtotal?: number;
  discountAmount?: number;
  couponCode?: string;
  shippingCharges?: number;
  shippingZone?: string;
  addPhotoFrame?: boolean;
  baseFramePrice?: number;
  framePrice?: number;
}

export async function sendOrderReceipt(data: ReceiptData) {
  const { EMAIL_USER: SMTP_USER, EMAIL_PASS: SMTP_PASS } = env;

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('❌ [Email Error] Missing credentials for sendOrderReceipt');
    return { success: false, error: 'Missing credentials' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT,
      secure: env.EMAIL_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const customerMailOptions = {
      from: `"The Virtual Canvas" <${SMTP_USER}>`,
      to: data.email,
      subject: `Your Order is Confirmed — ${data.orderId} ` + "🎨",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 60px 40px; color: #111; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; background-color: #fcfcfc;">
          
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="display: inline-block; border: 1px solid #eaeaea; padding: 15px 20px; margin-bottom: 20px; background: #fff;">
              <span style="font-family: Georgia, serif; font-size: 20px; letter-spacing: 4px; color: #111;">TVC</span>
            </div>
            <h1 style="font-family: Georgia, serif; color: #111; margin-bottom: 10px; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">The Virtual Canvas</h1>
            <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 4px; color: #999; margin-top: 0;">Official Order Receipt</p>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 40px 0;" />
          
          <table style="width: 100%; border-collapse: collapse; margin: 40px 0;">
            <tr>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff; vertical-align: top;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Billed To</p>
                <p style="font-family: Georgia, serif; font-size: 18px; margin: 0 0 5px 0; color: #111; text-transform: capitalize;">${data.customerName}</p>
                <p style="font-size: 11px; margin: 0 0 5px 0; color: #666;">${data.email}</p>
                ${data.address ? `<p style="font-size: 10px; margin: 5px 0 0 0; color: #888; border-top: 1px solid #f0f0f0; padding-top: 5px;">${data.address}<br/>PIN: ${data.pincode}</p>` : ''}
              </td>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff; text-align: right; vertical-align: top;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Payment Status</p>
                <span style="background-color: #fef3c7; color: #b45309; padding: 6px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; border-radius: 20px;">Pending Verification</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff; vertical-align: top;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Tracking ID</p>
                <p style="font-family: monospace; font-size: 14px; margin: 0; color: #111; background: #f5f5f5; padding: 5px 10px; display: inline-block;">${data.orderId}</p>
              </td>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff; text-align: right; vertical-align: top;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Artwork Series</p>
                <p style="font-size: 12px; margin: 0; color: #111; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">${data.artworkType}</p>
              </td>
            </tr>
            
            <!-- Dynamic Billing Breakdown -->
            <tr>
              <td colspan="2" style="padding: 25px 20px; border: 1px solid #eaeaea; background: #fff;">
                <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 15px 0; font-weight: bold; border-bottom: 1px solid #eaeaea; padding-bottom: 8px;">Investment Breakdown</p>
                
                <table style="width: 100%; font-size: 12px; line-height: 2;">
                  <!-- Base Price -->
                  <tr>
                    <td style="color: #666;">Artwork Commission Base</td>
                    <td style="text-align: right; font-weight: bold; color: #111;">₹${(data.subtotal ? Math.round(data.subtotal) : data.price).toLocaleString()}</td>
                  </tr>
                  
                  <!-- Premium Frame Price if requested -->
                  ${data.addPhotoFrame ? `
                  <tr>
                    <td style="color: #666;">Premium Photo Frame</td>
                    <td style="text-align: right; font-weight: bold; color: #111;">
                      ${data.baseFramePrice && data.baseFramePrice > 0 && data.framePrice === 0 ? `
                        <span style="text-decoration: line-through; color: #aaa; font-weight: normal; margin-right: 5px;">₹${data.baseFramePrice}</span>
                        <span style="color: #047857;">FREE (Promo)</span>
                      ` : `+₹${data.framePrice || 0}`}
                    </td>
                  </tr>
                  ` : ''}
                  
                  <!-- Delivery Shipping Charges -->
                  ${(data.shippingCharges !== undefined || data.shippingZone) ? `
                  <tr>
                    <td style="color: #666;">Delivery (${data.shippingZone || 'Standard'})</td>
                    <td style="text-align: right; font-weight: bold; color: #111;">
                      ${data.shippingCharges === 0 && data.couponCode ? `
                        <span style="color: #047857;">FREE (Promo)</span>
                      ` : (data.shippingCharges === 0 ? 'FREE' : `+₹${(data.shippingCharges || 0).toLocaleString()}`)}
                    </td>
                  </tr>
                  ` : ''}
                  
                  <!-- Coupon savings -->
                  ${data.couponCode ? `
                  <tr style="color: #047857; font-weight: bold; background-color: #ecfdf5;">
                    <td style="padding: 5px 10px;">Promo Applied (${data.couponCode})</td>
                    <td style="text-align: right; padding: 5px 10px;">-₹${(data.discountAmount || 0).toLocaleString()}</td>
                  </tr>
                  ` : ''}
                </table>
              </td>
            </tr>

            <tr>
              <td colspan="2" style="padding: 40px 20px; border: 1px solid #eaeaea; background: #fff; text-align: center;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 15px 0;">Total Amount Paid</p>
                <p style="font-family: Georgia, serif; font-size: 48px; margin: 0; color: #111;">₹${data.price.toLocaleString()}.00</p>
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 15px 0 0 0;">Secure UPI Network</p>
              </td>
            </tr>
          </table>

          <div style="text-align: center; margin: 50px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thevirtualcanvas.com'}/track-order?id=${data.orderId}" style="background-color: #111; color: #fff; padding: 18px 40px; text-decoration: none; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; display: inline-block; border: 1px solid #111;">Track Status</a>
          </div>

          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 50px 0 30px 0;" />
          
          <div style="text-align: center; margin-bottom: 30px;">
            <p style="font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #666; line-height: 1.8; margin: 0 0 10px 0; padding: 0 20px;">
              Every artwork we create is crafted with precision, passion, and a deep respect for your vision.
            </p>
            <p style="font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #666; line-height: 1.8; margin: 0; padding: 0 20px;">
              We don't just create art — we transform your ideas into timeless, meaningful visual experiences.
            </p>
          </div>
          
          <div style="width: 40px; height: 1px; background-color: #ddd; margin: 0 auto 30px auto;"></div>

          <p style="font-size: 8px; text-align: center; color: #aaa; text-transform: uppercase; letter-spacing: 4px; margin: 0;">Crafted with care by The Virtual Canvas</p>
        </div>
      `,
    };

    const adminMailOptions = {
      from: `"The Virtual Canvas System" <${SMTP_USER}>`,
      to: SMTP_USER,
      subject: `New Order Received — ${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; background-color: #fafafa;">
          <h2 style="font-family: Georgia, serif; color: #1a1a1a; margin-bottom: 5px;">🚨 New Artwork Commission</h2>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Customer Name:</strong> ${data.customerName}</p>
          <p><strong>Email Address:</strong> ${data.email}</p>
          <p><strong>Shipping Address:</strong> ${data.address || 'N/A'}</p>
          <p><strong>Pin Code:</strong> ${data.pincode || 'N/A'}</p>
          <p><strong>Artwork Type:</strong> ${data.artworkType}</p>
          
          <div style="background: #fff; border: 1px solid #eaeaea; padding: 15px; margin: 20px 0; font-size: 13px; line-height: 1.8;">
            <p style="font-weight: bold; border-bottom: 1px solid #eee; margin: 0 0 10px 0; padding-bottom: 5px;">Price Breakdown</p>
            <p>Artwork Subtotal: ₹${(data.subtotal || data.price).toLocaleString()}</p>
            ${data.addPhotoFrame ? `<p>Frame Charge: ${data.baseFramePrice && data.baseFramePrice > 0 && data.framePrice === 0 ? `<span style="text-decoration:line-through;color:#999">₹${data.baseFramePrice}</span> FREE (Promo)` : `+₹${data.framePrice}`}</p>` : ''}
            <p>Shipping Charge: ${data.shippingCharges === 0 && data.couponCode ? 'FREE (Promo)' : `+₹${data.shippingCharges || 0}`}</p>
            ${data.couponCode ? `<p style="color:#047857">Coupon: ${data.couponCode} (-₹${data.discountAmount})</p>` : ''}
            <p style="font-size: 15px; font-weight: bold; border-top: 1px solid #eee; margin-top: 10px; padding-top: 5px;">Total Paid: ₹${data.price.toLocaleString()}.00</p>
          </div>
          <br/>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thevirtualcanvas.com'}/studio" style="padding: 12px 24px; background: #111; color: #fff; text-decoration: none; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; display: inline-block;">Open Sanity Studio</a>
        </div>
      `
    };

    await Promise.all([
      transporter.sendMail(customerMailOptions),
      transporter.sendMail(adminMailOptions)
    ]);
    return { success: true };
  } catch (error) {
    console.error('Email transmission dropped:', error);
    return { success: false, error };
  }
}
