"""
NAUTILUS Banking System — Universal Email Service
Supports both Brevo (xkeysib-...) and Resend (re_...) API keys seamlessly.
"""

import os
import httpx
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"
RESEND_API_URL = "https://api.resend.com/emails"


def get_email_api_key() -> str:
    """Retrieve API key for Brevo or Resend from multiple possible env variable names."""
    return (
        os.getenv("Brevo_Key")
        or os.getenv("BREVO_API_KEY")
        or os.getenv("brevo_api_key")
        or os.getenv("BREVO_KEY")
        or ""
    ).strip()


def get_sender_email(is_resend: bool = False) -> str:
    """Retrieve verified sender email for provider."""
    if is_resend:
        return (
            os.getenv("RESEND_SENDER_EMAIL")
            or os.getenv("BREVO_SENDER_EMAIL")
            or os.getenv("SMTP_EMAIL")
            or os.getenv("SENDER_EMAIL")
            or ""
        ).strip()
    return (
        os.getenv("BREVO_SENDER_EMAIL")
        or os.getenv("brevo_sender_email")
        or os.getenv("SMTP_EMAIL")
        or os.getenv("SENDER_EMAIL")
        or ""
    ).strip()


class EmailMessage(BaseModel):
    to_email: str
    to_name: Optional[str] = None
    subject: str
    html_content: str
    text_content: Optional[str] = None


async def send_email_via_brevo(email: EmailMessage) -> bool:
    """
    Core function to dispatch emails via Brevo or Resend depending on API key type.
    """
    api_key = get_email_api_key()
    if not api_key:
        print("[EMAIL WARNING] No Email API key configured in environment.")
        return False

    is_resend = api_key.startswith("re_")

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            if is_resend:
                sender = get_sender_email(is_resend=True)
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "from": sender,
                    "to": [email.to_email],
                    "subject": email.subject,
                    "html": email.html_content
                }
                if email.text_content:
                    payload["text"] = email.text_content

                response = await client.post(RESEND_API_URL, headers=headers, json=payload)
                response.raise_for_status()
                print(f"[RESEND SUCCESS] Email sent to {email.to_email}")
                return True
            else:
                sender_email = get_sender_email(is_resend=False)
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

                response = await client.post(BREVO_API_URL, headers=headers, json=payload)
                response.raise_for_status()
                print(f"[BREVO SUCCESS] Email sent to {email.to_email}")
                return True

        except httpx.HTTPStatusError as e:
            provider = "RESEND" if is_resend else "BREVO"
            print(f"[{provider} HTTP ERROR] Failed to send email: {e.response.text}")
            return False
        except Exception as e:
            print(f"[EMAIL EXCEPTION] Error sending email: {str(e)}")
            return False


async def send_otp_email(to_email: str, otp_code: str, account_holder_name: Optional[str] = None, bank_id: str = "CPB") -> bool:
    """
    Sends OTP verification code email with styled HTML template.
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


async def send_password_changed_email(to_email: str, account_holder_name: Optional[str] = None, bank_id: str = "CPB", ip_address: str = "Unknown") -> bool:
    """
    Sends password change confirmation security email.
    """
    name = (account_holder_name or "Valued Customer").title()
    bank_upper = bank_id.upper()

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #09090b; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-family: monospace;">NAUTILUS</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #a1a1aa; letter-spacing: 1px;">SECURITY ALERT — {bank_upper}</p>
        </div>
        <div style="padding: 30px; background-color: #fdfdfd; color: #333;">
            <p style="font-size: 16px;">Hello {name},</p>
            <p style="font-size: 14px; color: #555;">Your password for your <strong>{bank_upper}</strong> account was successfully changed.</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 4px 0;"><strong>Bank:</strong> {bank_upper}</p>
                <p style="margin: 4px 0;"><strong>IP Address:</strong> {ip_address}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> Completed via Verified 2FA</p>
            </div>
            <p style="font-size: 13px; color: #777;">If you did not make this change, please contact support immediately at <a href="mailto:nautilus.project.00001@gmail.com" style="color: #2563eb;">nautilus.project.00001@gmail.com</a>.</p>
        </div>
        <div style="background-color: #f4f4f5; color: #71717a; padding: 15px; text-align: center; font-size: 11px;">
            &copy; 2026 NAUTILUS Project — All Connected Payments Interface.
        </div>
    </div>
    """

    msg = EmailMessage(
        to_email=to_email,
        to_name=name,
        subject=f"NAUTILUS [{bank_upper}] — Password Successfully Changed",
        html_content=html_content
    )

    return await send_email_via_brevo(msg)


async def send_account_deletion_email(to_email: str, account_holder_name: Optional[str] = None, bank_id: str = "CPB", scheduled_deletion_date: str = "7 days from now") -> bool:
    """
    Sends account deletion confirmation and farewell notification email.
    """
    name = (account_holder_name or "Valued Customer").title()
    bank_upper = bank_id.upper()

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #18181b; color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px; font-family: monospace;">NAUTILUS</h1>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #ef4444; letter-spacing: 1px;">ACCOUNT STATUS UPDATE — ON-HOLD</p>
        </div>
        <div style="padding: 30px; background-color: #fdfdfd; color: #333;">
            <p style="font-size: 16px;">Dear {name},</p>
            <p style="font-size: 14px; color: #555;">We have received your request to delete your <strong>{bank_upper}</strong> bank account. Sorry to see you go!</p>
            
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #991b1b;">
                <p style="margin: 4px 0; font-weight: bold;">Account Status: ON-HOLD</p>
                <p style="margin: 4px 0;">Your account has been deactivated. All logins, transfers, and incoming deposits are suspended.</p>
                <p style="margin: 4px 0;"><strong>Scheduled Permanent Deletion:</strong> {scheduled_deletion_date}</p>
            </div>

            <p style="font-size: 13px; color: #555;">
                If you change your mind and wish to reactivate your account before the scheduled deletion date, please contact our support team at:
                <br/>
                <a href="mailto:nautilus.project.00001@gmail.com" style="color: #2563eb; font-weight: bold;">nautilus.project.00001@gmail.com</a>
            </p>
        </div>
        <div style="background-color: #f4f4f5; color: #71717a; padding: 15px; text-align: center; font-size: 11px;">
            &copy; 2026 NAUTILUS Project — All Connected Payments Interface.
        </div>
    </div>
    """

    msg = EmailMessage(
        to_email=to_email,
        to_name=name,
        subject=f"NAUTILUS [{bank_upper}] — Account Deletion Scheduled & On-Hold Status",
        html_content=html_content
    )

    return await send_email_via_brevo(msg)

