"""
NAUTILUS Banking System — Account Router
Handles Account Settings: Password Change, Forgot Password (via OTP),
and Account Deletion (Soft Delete with 7-Day Grace Period).
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status

from models.schemas import (
    PasswordResetRequest,
    PasswordResetConfirm,
    ChangePasswordRequest,
    AccountDeleteRequest,
    AccountStatusResponse,
)
from db.client import get_supabase_client
from middleware.auth import verify_common
from middleware.brevo_service import (
    send_otp_email,
    send_password_changed_email,
    send_account_deletion_email,
)
from middleware.otp_service import (
    get_client_ip,
    check_rate_limit,
    generate_otp,
    verify_otp_code,
)
from routers.auth_router import hash_password

router = APIRouter(prefix="/account", tags=["Account Management"])


@router.post("/forgot-password/request")
async def request_password_reset(req: PasswordResetRequest, request: Request):
    """
    Initiates password reset by verifying user existence and sending a 6-digit OTP code.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=10, window_seconds=60, block_minutes=5)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    bank_id = req.bank_id.strip().lower()
    clean_email = req.email.strip().lower()
    table_name = f"{bank_id}_database"

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    try:
        res = (
            supabase.table(table_name)
            .select("bank_user_id, account_holder_name, status")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    if not res.data or len(res.data) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"No account associated with this email in {req.bank_id.upper()}."
        )

    user = res.data[0]
    if user.get("status") == "on-hold":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is on-hold with this bank. Please contact nautilus.project.00001@gmail.com to activate it."
        )

    account_name = user.get("account_holder_name", "Account Holder")

    # Generate OTP
    ok, otp_code, msg = generate_otp(clean_email, bank_id, ip)
    if not ok:
        raise HTTPException(status_code=429, detail=msg)

    # Dispatch OTP via Brevo
    try:
        await send_otp_email(clean_email, otp_code, account_name, bank_id)
    except Exception as e:
        print(f"[FORGOT PASSWORD SEND OTP ERROR]: {e}")

    return {
        "success": True,
        "message": f"Password reset OTP has been sent to {clean_email}."
    }


@router.post("/forgot-password/confirm")
async def confirm_password_reset(req: PasswordResetConfirm, request: Request):
    """
    Verifies the OTP code and sets the new password for the account.
    """
    ip = get_client_ip(request)
    bank_id = req.bank_id.strip().lower()
    clean_email = req.email.strip().lower()
    table_name = f"{bank_id}_database"

    # Verify OTP
    ok, msg, _ = verify_otp_code(clean_email, bank_id, req.otp_code, ip)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    # Check user row & status
    res = (
        supabase.table(table_name)
        .select("bank_user_id, account_holder_name, status")
        .eq("email", clean_email)
        .limit(1)
        .execute()
    )
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Account not found.")

    user = res.data[0]
    if user.get("status") == "on-hold":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is on-hold with this bank. Please contact nautilus.project.00001@gmail.com to activate it."
        )

    # Update password
    new_hash = hash_password(req.new_password)
    try:
        supabase.table(table_name).update({"password_hash": new_hash}).eq("email", clean_email).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update password: {str(e)}")

    # Send confirmation security email
    try:
        await send_password_changed_email(
            to_email=clean_email,
            account_holder_name=user.get("account_holder_name"),
            bank_id=bank_id,
            ip_address=ip
        )
    except Exception as e:
        print(f"[SEND PASSWORD CHANGED EMAIL ERROR]: {e}")

    return {
        "success": True,
        "message": "Password successfully updated! You can now log in with your new password."
    }


@router.post("/change-password")
async def change_password_authenticated(
    req: ChangePasswordRequest,
    request: Request,
    auth_data: dict = Depends(verify_common),
):
    """
    Authenticated route:
    Allows a currently logged-in user to change their password by supplying the old password.
    """
    bank_id = auth_data.get("bank_id", "").lower()
    bank_user_id = auth_data.get("bank_user_id")
    email = auth_data.get("email")
    ip = get_client_ip(request)

    if not bank_id or not bank_user_id:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    table_name = f"{bank_id}_database"
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    # Retrieve current user record
    res = supabase.table(table_name).select("*").eq("bank_user_id", bank_user_id).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Account not found.")

    user = res.data[0]
    if user.get("status") == "on-hold":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is on-hold with this bank. Please contact nautilus.project.00001@gmail.com to activate it."
        )

    # Validate old password
    old_hash = hash_password(req.old_password)
    stored_hash = user.get("password_hash")
    if stored_hash and stored_hash != old_hash and stored_hash != req.old_password:
        raise HTTPException(status_code=400, detail="Current password does not match.")

    # Update to new password
    new_hash = hash_password(req.new_password)
    supabase.table(table_name).update({"password_hash": new_hash}).eq("bank_user_id", bank_user_id).execute()

    # Send confirmation security alert
    user_email = user.get("email") or email
    if user_email:
        try:
            await send_password_changed_email(
                to_email=user_email,
                account_holder_name=user.get("account_holder_name"),
                bank_id=bank_id,
                ip_address=ip
            )
        except Exception as e:
            print(f"[SEND PASSWORD CHANGED EMAIL ERROR]: {e}")

    return {
        "success": True,
        "message": "Password changed successfully."
    }


@router.post("/delete", response_model=AccountStatusResponse)
async def delete_account(
    request: Request,
    auth_data: dict = Depends(verify_common),
):
    """
    Authenticated route:
    Marks the user's account as 'on-hold' with a 7-day grace period before permanent deletion.
    """
    bank_id = auth_data.get("bank_id", "").lower()
    bank_user_id = auth_data.get("bank_user_id")
    email = auth_data.get("email")

    if not bank_id or not bank_user_id:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    table_name = f"{bank_id}_database"
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    # Check user row
    res = supabase.table(table_name).select("*").eq("bank_user_id", bank_user_id).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Account not found.")

    user = res.data[0]
    now_utc = datetime.utcnow()
    scheduled_date = now_utc + timedelta(days=7)
    formatted_date = scheduled_date.strftime("%B %d, %Y at %H:%M UTC")

    # Mark as on-hold
    supabase.table(table_name).update({
        "status": "on-hold",
        "deletion_requested_at": now_utc.isoformat(),
    }).eq("bank_user_id", bank_user_id).execute()

    # Send deletion notice email
    user_email = user.get("email") or email
    if user_email:
        try:
            await send_account_deletion_email(
                to_email=user_email,
                account_holder_name=user.get("account_holder_name"),
                bank_id=bank_id,
                scheduled_deletion_date=formatted_date
            )
        except Exception as e:
            print(f"[SEND DELETION EMAIL ERROR]: {e}")

    return AccountStatusResponse(
        success=True,
        status="on-hold",
        deletion_requested_at=now_utc.isoformat(),
        deletion_scheduled_for=formatted_date,
        message=f"Your account is now on-hold and scheduled for permanent deletion on {formatted_date}."
    )


@router.get("/status", response_model=AccountStatusResponse)
async def get_account_status(
    auth_data: dict = Depends(verify_common),
):
    """
    Authenticated route:
    Retrieves current account status and deletion schedule if on-hold.
    """
    bank_id = auth_data.get("bank_id", "").lower()
    bank_user_id = auth_data.get("bank_user_id")

    if not bank_id or not bank_user_id:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    table_name = f"{bank_id}_database"
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable.")

    res = supabase.table(table_name).select("*").eq("bank_user_id", bank_user_id).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=404, detail="Account not found.")

    user = res.data[0]
    user_status = user.get("status", "active")
    deletion_requested_at = user.get("deletion_requested_at")
    scheduled_for = None

    if deletion_requested_at:
        try:
            req_dt = datetime.fromisoformat(deletion_requested_at.replace("Z", "+00:00"))
            sched_dt = req_dt + timedelta(days=7)
            scheduled_for = sched_dt.strftime("%B %d, %Y at %H:%M UTC")
        except Exception:
            scheduled_for = "7 days from deletion request"

    return AccountStatusResponse(
        success=True,
        status=user_status,
        deletion_requested_at=deletion_requested_at,
        deletion_scheduled_for=scheduled_for,
        message=f"Account status: {user_status}"
    )
