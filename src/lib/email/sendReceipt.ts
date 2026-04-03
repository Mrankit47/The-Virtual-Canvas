import nodemailer from 'nodemailer';

interface ReceiptData {
  orderId: string;
  customerName: string;
  artworkType: string;
  price: number;
  email: string;
}

export async function sendOrderReceipt(data: ReceiptData) {
  const { SMTP_USER, SMTP_PASS } = process.env;

  // Fallback to strict console diagnostics if environment lacks SMTP credentials
  if (!SMTP_USER || !SMTP_PASS) {
    console.log('📧 [MOCK EMAIL dispatched via Nodemailer hook] ->', data.email);
    console.log('Payload:', data);
    return { success: true, mocked: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Default service provider mapping
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const customerMailOptions = {
      from: `"The Virtual Canvas" <ankitkushwah0210k@gmail.com>`,
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
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Billed To</p>
                <p style="font-family: Georgia, serif; font-size: 18px; margin: 0 0 5px 0; color: #111; text-transform: capitalize;">${data.customerName}</p>
                <p style="font-size: 11px; margin: 0; color: #666;">${data.email}</p>
              </td>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff; text-align: right;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Payment Status</p>
                <span style="background-color: #fef3c7; color: #b45309; padding: 6px 12px; font-size: 9px; text-transform: uppercase; letter-spacing: 2px; font-weight: bold; border-radius: 20px;">Pending Verification</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Tracking ID</p>
                <p style="font-family: monospace; font-size: 14px; margin: 0; color: #111; background: #f5f5f5; padding: 5px 10px; display: inline-block;">${data.orderId}</p>
              </td>
              <td style="padding: 20px; border: 1px solid #eaeaea; background: #fff; text-align: right;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 10px 0;">Artwork Series</p>
                <p style="font-size: 12px; margin: 0; color: #111; text-transform: uppercase; letter-spacing: 2px; font-weight: bold;">${data.artworkType}</p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 40px 20px; border: 1px solid #eaeaea; background: #fff; text-align: center;">
                <p style="font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #999; margin: 0 0 15px 0;">Total Investment</p>
                <p style="font-family: Georgia, serif; font-size: 48px; margin: 0; color: #111;">₹${data.price}.00</p>
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
      from: `"The Virtual Canvas System" <ankitkushwah0210k@gmail.com>`,
      to: "ankitkushwah0210k@gmail.com",
      subject: `New Order Received — ${data.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #111; max-w: 600px; margin: 0 auto; border: 1px solid #eaeaea; background-color: #fafafa;">
          <h2 style="font-family: Georgia, serif; color: #1a1a1a; margin-bottom: 5px;">🚨 New Artwork Commission</h2>
          <hr style="border: 0; border-top: 1px solid #eaeaea; margin: 20px 0;" />
          <p><strong>Order ID:</strong> ${data.orderId}</p>
          <p><strong>Customer Name:</strong> ${data.customerName}</p>
          <p><strong>Email Address:</strong> ${data.email}</p>
          <p><strong>Artwork Type:</strong> ${data.artworkType}</p>
          <p><strong>Price:</strong> ₹${data.price}.00</p>
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
