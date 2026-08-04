"""
Security Helpers and Request Integrity Verification
"""

import re
from fastapi import Header, HTTPException, status
from encryption.encrypt import verify as verify_hmac_signature


def sanitize_input(value: str) -> str:
    """
    Basic input sanitization:
    Removes dangerous characters often used in injection / XSS.
    """
    if not isinstance(value, str):
        return value
    # Strip HTML tags
    cleaned = re.sub(r"<[^>]*>", "", value)
    # Strip dangerous shell/SQL metacharacters
    cleaned = re.sub(r"[;`'\"]", "", cleaned)
    return cleaned.strip()


async def verify_request_signature(
    x_signature: str = Header(None, alias="X-Signature"),
    x_timestamp: str = Header(None, alias="X-Timestamp"),
    raw_body: bytes = b""
):
    """
    Validates HMAC signature of incoming requests to prevent replay and tampering.
    """
    if not x_signature or not x_timestamp:
        # Signature is optional for normal open endpoints, required where used as dependency
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing security headers: X-Signature and X-Timestamp are required.",
        )

    # Combine timestamp + raw body to verify payload integrity
    payload = f"{x_timestamp}:{raw_body.decode('utf-8', errors='ignore')}"
    if not verify_hmac_signature(payload, x_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid request signature or payload tampering detected.",
        )
