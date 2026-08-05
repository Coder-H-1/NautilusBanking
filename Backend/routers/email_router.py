"""
NAUTILUS Banking System — Email Test Router
Matches WEB email router pattern (/email/test).
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from middleware.brevo_service import send_email_via_brevo, EmailMessage, send_otp_email

router = APIRouter(prefix="/email", tags=["Email"])


class TestEmailRequest(BaseModel):
    to_email: str


@router.post("/test", status_code=status.HTTP_200_OK)
async def test_send_email(req: TestEmailRequest):
    """Test endpoint matching WEB /email/test."""
    message = EmailMessage(
        to_email=req.to_email,
        subject="Test Email from NAUTILUS Brevo API",
        html_content="<h1>Hello!</h1><p>This is a test email sent via Brevo API from NAUTILUS Banking System.</p>"
    )

    success = await send_email_via_brevo(message)
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send email. Please verify BREVO_API_KEY / Brevo_Key and BREVO_SENDER_EMAIL in environment."
        )

    return {"message": "Email sent successfully", "recipient": req.to_email}


@router.post("/test-otp", status_code=status.HTTP_200_OK)
async def test_send_otp(req: TestEmailRequest):
    """Test OTP template email."""
    success = await send_otp_email(req.to_email, "849201", "Test User", "CPB")
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to send OTP email. Please check Brevo API key and sender configuration."
        )

    return {"message": "OTP email sent successfully", "recipient": req.to_email}
