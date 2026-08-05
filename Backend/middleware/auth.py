"""
Supabase & Custom JWT Auth Middleware & Dependencies
Validates JWT tokens from requests using custom session JWTs or Supabase Auth.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from middleware.otp_service import decode_session_jwt

security_scheme = HTTPBearer(auto_error=False)


def get_token(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> str:
    """Extracts bearer token from Authorization header."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return credentials.credentials


async def verify_common(token: str = Depends(get_token)) -> dict:
    """
    Common route protector:
    1. Validates custom JWT session token.
    2. Validates Supabase Auth token if custom token is absent.
    """
    # 1. Custom JWT session token check
    decoded = decode_session_jwt(token)
    if decoded:
        bank_user_id = decoded.get("bank_user_id") or decoded.get("sub", 1)
        return {
            "user": {
                "id": str(bank_user_id),
                "email": decoded.get("email", ""),
                "user_metadata": {
                    "account_holder_name": decoded.get("account_holder_name", ""),
                    "bank_id": decoded.get("bank_id", ""),
                    "role": "user",
                },
                "app_metadata": {
                    "role": "user",
                },
            },
            "custom_jwt": decoded,
        }

    # 2. Supabase Auth fallback
    from db.client import get_supabase_client
    supabase = get_supabase_client()
    if supabase:
        try:
            user_response = supabase.auth.get_user(token)
            if user_response and user_response.user:
                return {"user": user_response.user}
        except Exception:
            pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired session token.",
    )


async def verify_protected(token: str = Depends(get_token)) -> dict:
    """
    Protected route protector:
    Validates that request comes with bank-level or internal ACPI authority.
    """
    decoded = decode_session_jwt(token)
    if decoded:
        return {"user": decoded, "role": "service_role"}

    user_data = await verify_common(token)
    user = user_data["user"]

    if isinstance(user, dict):
        role = user.get("app_metadata", {}).get("role") or user.get("user_metadata", {}).get("role")
    else:
        app_meta = getattr(user, "app_metadata", {}) or {}
        user_meta = getattr(user, "user_metadata", {}) or {}
        role = app_meta.get("role") or user_meta.get("role")

    if role not in ["bank", "service_role", "admin", "user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. High-level bank authorization required.",
        )

    return {"user": user, "role": role or "user"}
