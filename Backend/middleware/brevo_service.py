"""
NAUTILUS Banking System — Brevo Email Service
Sends branded OTP verification and login activity notification emails using Brevo (Sendinblue) API.
"""

import os
import httpx
from datetime import datetime

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "nautilus-project-00001@gmail.com")
SENDER_NAME = "NAUTILUS Banking System"


def get_brevo_api_key() -> str:
    """Load Brevo API key from environment (checks both Brevo_Key and BREVO_API_KEY)."""
    return os.getenv("Brevo_Key") or os.getenv("BREVO_API_KEY") or ""


async def send_otp_email(to_email: str, otp_code: str, account_holder_name: str, bank_id: str) -> bool:
    """
    Sends a 6-digit OTP email styled with the NAUTILUS dark/zinc theme.
    """
    api_key = get_brevo_api_key()
    if not api_key:
        print("[BREVO WARNING] No Brevo_Key configured. Simulating OTP send:", otp_code)
        return True

    formatted_name = account_holder_name.title()
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 24px;
          color: #18181b;
        }}
        .container {{
          max-width: 520px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e4e4e7;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }}
        .header {{
          background-color: #09090b;
          color: #ffffff;
          padding: 24px 32px;
          text-align: center;
        }}
        .header h1 {{
          margin: 0;
          font-size: 20px;
          letter-spacing: 2px;
          font-family: monospace;
          font-weight: 700;
        }}
        .header p {{
          margin: 4px 0 0 0;
          font-size: 11px;
          color: #a1a1aa;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }}
        .body {{
          padding: 32px;
        }}
        .greeting {{
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 12px;
        }}
        .desc {{
          font-size: 13px;
          color: #52525b;
          line-height: 1.6;
          margin-bottom: 24px;
        }}
        .otp-box {{
          background-color: #f4f4f5;
          border: 1px dashed #71717a;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }}
        .otp-code {{
          font-family: monospace;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #09090b;
          margin: 0;
        }}
        .expiry {{
          font-size: 11px;
          color: #ef4444;
          font-weight: 600;
          margin-top: 8px;
        }}
        .bank-badge {{
          display: inline-block;
          background-color: #18181b;
          color: #ffffff;
          font-family: monospace;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
          margin-bottom: 12px;
        }}
        .footer {{
          background-color: #fafafa;
          border-top: 1px solid #e4e4e7;
          padding: 16px 32px;
          text-align: center;
          font-size: 11px;
          color: #71717a;
          line-height: 1.4;
        }}
        .disclaimer {{
          font-size: 10px;
          color: #a1a1aa;
          margin-top: 8px;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NAUTILUS</h1>
          <p>ACPI Secure Authentication Core</p>
        </div>
        <div class="body">
          <div class="bank-badge">BANK: {bank_id.upper()}</div>
          <div class="greeting">Hello {formatted_name},</div>
          <div class="desc">
            You requested a One-Time Password (OTP) to authenticate with your <strong>{bank_id.upper()}</strong> banking account on NAUTILUS. Use the code below to complete your verification:
          </div>
          <div class="otp-box">
            <div class="otp-code">{otp_code}</div>
            <div class="expiry">Expires in 3 minutes (180 seconds)</div>
          </div>
          <div class="desc" style="margin-bottom: 0;">
            If you did not initiate this request, please disregard this email. Never share this code with anyone.
          </div>
        </div>
        <div class="footer">
          <div>NAUTILUS All Connected Payments Interface</div>
          <div class="disclaimer">
            NOTICE: NAUTILUS is an educational and hobby simulation project. Not affiliated with RBI, NPCI, or real banking networks. No real money or monetary value is involved.
          </div>
        </div>
      </div>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": formatted_name}],
        "subject": f"NAUTILUS [{bank_id.upper()}] — Your Verification Code: {otp_code}",
        "htmlContent": html_content,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                BREVO_API_URL,
                json=payload,
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            if res.status_code in (200, 201, 202):
                return True
            print(f"[BREVO ERROR] Status: {res.status_code}, Body: {res.text}")
            return False
    except Exception as e:
        print(f"[BREVO EXCEPTION] Failed to send email: {e}")
        return False


async def send_login_notification(to_email: str, account_holder_name: str, bank_id: str, ip_address: str = "Unknown") -> bool:
    """
    Sends a security alert email when a new successful login occurs.
    """
    api_key = get_brevo_api_key()
    if not api_key:
        print("[BREVO WARNING] No Brevo_Key configured. Simulating login alert for:", to_email)
        return True

    formatted_name = account_holder_name.title()
    login_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f4f4f5;
          margin: 0;
          padding: 24px;
          color: #18181b;
        }}
        .container {{
          max-width: 520px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1px solid #e4e4e7;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }}
        .header {{
          background-color: #09090b;
          color: #ffffff;
          padding: 20px 32px;
          text-align: center;
        }}
        .header h1 {{
          margin: 0;
          font-size: 18px;
          letter-spacing: 2px;
          font-family: monospace;
          font-weight: 700;
        }}
        .body {{
          padding: 32px;
        }}
        .alert-badge {{
          display: inline-block;
          background-color: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 9999px;
          margin-bottom: 16px;
        }}
        .details-box {{
          background-color: #f4f4f5;
          border-radius: 8px;
          padding: 16px;
          margin: 16px 0;
          font-size: 12px;
          line-height: 1.8;
          font-family: monospace;
        }}
        .footer {{
          background-color: #fafafa;
          border-top: 1px solid #e4e4e7;
          padding: 16px 32px;
          text-align: center;
          font-size: 11px;
          color: #71717a;
        }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NAUTILUS SECURITY</h1>
        </div>
        <div class="body">
          <div class="alert-badge">SECURITY NOTICE: SUCCESSFUL LOGIN</div>
          <p style="font-size: 14px; margin-top: 0;">
            Hello <strong>{formatted_name}</strong>,
          </p>
          <p style="font-size: 13px; color: #52525b;">
            A new session was established on your <strong>{bank_id.upper()}</strong> bank account via the NAUTILUS Inter-Bank Portal.
          </p>
          <div class="details-box">
            <div><strong>Bank:</strong> {bank_id.upper()}</div>
            <div><strong>Timestamp:</strong> {login_time}</div>
            <div><strong>Source IP:</strong> {ip_address}</div>
          </div>
          <p style="font-size: 12px; color: #71717a;">
            If this was you, you can safely ignore this email. If you did not perform this login, please contact security immediately.
          </p>
        </div>
        <div class="footer">
          NAUTILUS • Zero-Trust Inter-Bank Core
        </div>
      </div>
    </body>
    </html>
    """

    payload = {
        "sender": {"name": SENDER_NAME, "email": SENDER_EMAIL},
        "to": [{"email": to_email, "name": formatted_name}],
        "subject": f"NAUTILUS [{bank_id.upper()}] — Security Alert: New Login Activity",
        "htmlContent": html_content,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.post(
                BREVO_API_URL,
                json=payload,
                headers={
                    "api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            )
            return res.status_code in (200, 201, 202)
    except Exception as e:
        print(f"[BREVO EXCEPTION] Failed to send login notification: {e}")
        return False
