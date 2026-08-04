"""
Supabase Auth Middleware & Dependencies
Validates JWT tokens from requests using Supabase Auth.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import Client

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
    Validates any active user authenticated via Supabase Auth.
    """
    from db.client import get_supabase_client
    supabase: Client = get_supabase_client()
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token.",
            )
        return {"user": user_response.user}
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
        )


async def verify_protected(token: str = Depends(get_token)) -> dict:
    """
    Protected route protector:
    Validates that request comes with bank-level or internal ACPI authority.
    Checks Supabase user metadata for role == 'bank' or 'service_role'.
    """
    user_data = await verify_common(token)
    user = user_data["user"]

    # Check role from app_metadata or user_metadata
    app_meta = getattr(user, "app_metadata", {}) or {}
    user_meta = getattr(user, "user_metadata", {}) or {}
    role = app_meta.get("role") or user_meta.get("role")

    if role not in ["bank", "service_role", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. High-level bank authorization required.",
        )

    return {"user": user, "role": role}
