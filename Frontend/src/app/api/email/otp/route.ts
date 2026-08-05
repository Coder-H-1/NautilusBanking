import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to_email, otp_code, account_holder_name, bank_id } = body;

    if (!to_email || !otp_code) {
      return NextResponse.json({ success: false, error: "Missing to_email or otp_code" }, { status: 400 });
    }

    const apiKey = (
      process.env.RESEND_API_KEY ||
      process.env.Resend_Key ||
      process.env.Brevo_Key ||
      process.env.BREVO_API_KEY ||
      ""
    ).trim();

    if (!apiKey) {
      return NextResponse.json({ success: false, error: "No email API key configured on server." }, { status: 500 });
    }

    const bankUpper = (bank_id || "CPB").toUpperCase();
    const name = account_holder_name ? account_holder_name.charAt(0).toUpperCase() + account_holder_name.slice(1) : "Valued Customer";

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #09090b; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-family: monospace;">NAUTILUS</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa; letter-spacing: 1px;">${bankUpper} SECURE AUTHENTICATION</p>
        </div>
        <div style="padding: 30px; text-align: center; background-color: #fdfdfd;">
            <p style="font-size: 16px; color: #333;">Greetings ${name},</p>
            <p style="font-size: 15px; color: #555;">Please use the following 6-digit verification code to complete your authentication with <strong>${bankUpper}</strong>. This code is valid for 3 minutes.</p>
            <div style="margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #09090b; background-color: #f4f4f5; padding: 15px 30px; border-radius: 8px; border: 1px dashed #71717a; font-family: monospace;">${otp_code}</span>
            </div>
            <p style="font-size: 13px; color: #777;">If you did not request this code, please ignore this message. Never share this code with anyone.</p>
        </div>
        <div style="background-color: #f4f4f5; color: #71717a; padding: 15px; text-align: center; font-size: 11px;">
            &copy; 2026 NAUTILUS Project — All Connected Payments Interface. Simulation & Educational Purposes Only.
        </div>
    </div>
    `;

    const isResend = apiKey.startsWith("re_");

    if (isResend) {
      const sender = process.env.RESEND_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL || process.env.SENDER_EMAIL || "";
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [to_email],
          subject: `NAUTILUS [${bankUpper}] — Your Verification Code: ${otp_code}`,
          html: htmlContent,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        console.error("[RESEND API ERROR]", errorText);
        return NextResponse.json({ success: false, error: errorText }, { status: resendRes.status });
      }

      return NextResponse.json({ success: true, message: "Email sent successfully via Resend." });
    } else {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.brevo_sender_email || process.env.SMTP_EMAIL || process.env.SENDER_EMAIL || "";
      const payload = {
        sender: { name: "NAUTILUS Banking System", email: senderEmail },
        to: [{ email: to_email, name: name }],
        subject: `NAUTILUS [${bankUpper}] — Your Verification Code: ${otp_code}`,
        htmlContent: htmlContent,
      };

      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!brevoRes.ok) {
        const errorText = await brevoRes.text();
        console.error("[BREVO API ERROR]", errorText);
        return NextResponse.json({ success: false, error: errorText }, { status: brevoRes.status });
      }

      return NextResponse.json({ success: true, message: "Email sent successfully via Brevo." });
    }
  } catch (err: any) {
    console.error("[EMAIL ROUTE ERROR]", err);
    return NextResponse.json({ success: false, error: err.message || "Internal error" }, { status: 500 });
  }
}
