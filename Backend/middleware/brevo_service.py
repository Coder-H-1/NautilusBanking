"""
NAUTILUS Banking System — Brevo Email Service
Using same workflow and functions as WEB (send_email_via_brevo, EmailMessage, send_otp_email).
"""

import os
import httpx
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def get_brevo_api_key() -> str:
    """Retrieve Brevo API key from multiple possible env variable names."""
    return (
        os.getenv("Brevo_Key")
        or os.getenv("BREVO_API_KEY")
        or os.getenv("brevo_api_key")
        or os.getenv("BREVO_KEY")
        or ""
    ).strip()


def get_brevo_sender_email() -> str:
    """Retrieve verified Brevo sender email."""
    return (
        os.getenv("BREVO_SENDER_EMAIL")
        or os.getenv("brevo_sender_email")
        or os.getenv("SMTP_EMAIL")
        or os.getenv("SENDER_EMAIL")
        or "nautilus-project-00001@gmail.com"
    ).strip()


class EmailMessage(BaseModel):
    to_email: str
    to_name: Optional[str] = None
    subject: str
    html_content: str
    text_content: Optional[str] = None


async def send_email_via_brevo(email: EmailMessage) -> bool:
    """
    Core function to send emails via Brevo SMTP API (same workflow as WEB).
    """
    api_key = get_brevo_api_key()
    sender_email = get_brevo_sender_email()

    if not api_key:
        print("[BREVO WARNING] Brevo API key not configured in environment.")
        return False

    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    payload = {
        "sender": {"name": "NAUTILUS Banking System", "email": sender_email},
        "to": [{"email": email.to_email}],
        "subject": email.subject,
        "htmlContent": email.html_content
    }

    if email.to_name:
        payload["to"][0]["name"] = email.to_name

    if email.text_content:
        payload["textContent"] = email.text_content

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(BREVO_API_URL, headers=headers, json=payload)
            response.raise_for_status()
            print(f"[BREVO SUCCESS] Email successfully sent to {email.to_email}")
            return True
        except httpx.HTTPStatusError as e:
            error_details = e.response.text
            print(f"[BREVO HTTP ERROR] Failed to send email: {error_details}")
            return False
        except Exception as e:
            print(f"[BREVO EXCEPTION] Error sending email: {str(e)}")
            return False


async def send_otp_email(to_email: str, otp_code: str, account_holder_name: Optional[str] = None, bank_id: str = "CPB") -> bool:
    """
    Sends OTP verification code email with styled HTML template matching WEB.
    """
    name = (account_holder_name or "Valued Customer").title()
    bank_upper = bank_id.upper()

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #09090b; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-family: monospace;">NAUTILUS</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa; letter-spacing: 1px;">{bank_upper} SECURE AUTHENTICATION</p>
        </div>
        <div style="padding: 30px; text-align: center; background-color: #fdfdfd;">
            <p style="font-size: 16px; color: #333;">Greetings {name},</p>
            <p style="font-size: 15px; color: #555;">Please use the following 6-digit verification code to complete your authentication with <strong>{bank_upper}</strong>. This code is valid for 3 minutes.</p>
            <div style="margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #09090b; background-color: #f4f4f5; padding: 15px 30px; border-radius: 8px; border: 1px dashed #71717a; font-family: monospace;">{otp_code}</span>
            </div>
            <p style="font-size: 13px; color: #777;">If you did not request this code, please ignore this message. Never share this code with anyone.</p>
        </div>
        <div style="background-color: #f4f4f5; color: #71717a; padding: 15px; text-align: center; font-size: 11px;">
            &copy; 2026 NAUTILUS Project — All Connected Payments Interface. Simulation & Educational Purposes Only.
        </div>
    </div>
    """

    msg = EmailMessage(
        to_email=to_email,
        to_name=name,
        subject=f"NAUTILUS [{bank_upper}] — Your Verification Code: {otp_code}",
        html_content=html_content
    )

    return await send_email_via_brevo(msg)


async def send_login_notification(to_email: str, account_holder_name: str, bank_id: str, ip_address: str = "Unknown") -> bool:
    """
    Sends login security notification email.
    """
    name = (account_holder_name or "Valued Customer").title()
    bank_upper = bank_id.upper()
    now_str = httpx._types.HeaderTypes  # dummy reference check

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #09090b; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-family: monospace;">NAUTILUS</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa; letter-spacing: 1px;">SECURITY ALERT — {bank_upper}</p>
        </div>
        <div style="padding: 30px; background-color: #fdfdfd; color: #333;">
            <p style="font-size: 16px;">Hello {name},</p>
            <p style="font-size: 14px; color: #555;">A successful login to your <strong>{bank_upper}</strong> account was detected.</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 4px 0;"><strong>Bank:</strong> {bank_upper}</p>
                <p style="margin: 4px 0;"><strong>IP Address:</strong> {ip_address}</p>
            </div>
            <p style="font-size: 13px; color: #777;">If this was not you, please secure your account immediately.</p>
        </div>
        <div style="background-color: #f4f4f5; color: #71717a; padding: 15px; text-align: center; font-size: 11px;">
            &copy; 2026 NAUTILUS Project — All Connected Payments Interface.
        </div>
    </div>
    """

    msg = EmailMessage(
        to_email=to_email,
        to_name=name,
        subject=f"NAUTILUS [{bank_upper}] — Security Alert: New Login Detected",
        html_content=html_content
    )

    return await send_email_via_brevo(msg)
