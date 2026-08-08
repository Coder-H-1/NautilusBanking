"""
NAUTILUS Banking System — Custom Auth Router
Full custom authentication with account verification, Brevo OTP dispatch,
rate limiting, IP blocking, and JWT session handling backed by Supabase DB.
"""

import hashlib
import secrets
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request, status
from models.schemas import (
    CustomLoginRequest,
    CustomSignupRequest,
    OTPVerifyRequest,
    OTPResendRequest,
    CheckEmailRequest,
    CheckEmailResponse,
    AuthResponse,
    AuthDeviceRequest,
)
from db.client import get_supabase_client
from middleware.brevo_service import send_otp_email, send_login_notification
from middleware.otp_service import (
    get_client_ip,
    check_rate_limit,
    is_ip_blocked,
    generate_otp,
    verify_otp_code,
    create_session_jwt,
    decode_session_jwt,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    """Hash password with application salt."""
    salt = "nautilus_bank_salt_2026_acpi"
    return hashlib.sha256(f"{password}:{salt}".encode("utf-8")).hexdigest()


def generate_8digit_user_id(supabase, table_name: str) -> int:
    """Generates a unique 8-digit random integer ID (10000000 - 99999999)."""
    for _ in range(10):
        candidate_id = secrets.randbelow(90000000) + 10000000
        try:
            res = (
                supabase.table(table_name)
                .select("bank_user_id")
                .eq("bank_user_id", candidate_id)
                .limit(1)
                .execute()
            )
            if not res.data or len(res.data) == 0:
                return candidate_id
        except Exception:
            return candidate_id
    return secrets.randbelow(90000000) + 10000000


@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email_exists(req: CheckEmailRequest, request: Request):
    """
    Checks whether an email is already registered in the specified bank database.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=30, window_seconds=60, block_minutes=3)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    bank_id = req.bank_id.strip().lower()
    table_name = f"{bank_id}_database"
    clean_email = req.email.strip().lower()

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Please try again shortly."
        )

    try:
        res = (
            supabase.table(table_name)
            .select("bank_user_id, account_holder_name")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            return CheckEmailResponse(
                success=True,
                exists=True,
                message=f"User with this email already exists in {req.bank_id.upper()}. Please login."
            )
    except Exception as e:
        print(f"[CHECK EMAIL DB ERROR]: {e}")
        # Table might not have email column yet; fallback gracefully
        pass

    return CheckEmailResponse(
        success=True,
        exists=False,
        message="Email available for registration."
    )


@router.post("/signup", response_model=AuthResponse)
async def custom_signup(req: CustomSignupRequest, request: Request):
    """
    Creates a new user in the bank table and dispatches an OTP verification email.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=15, window_seconds=60, block_minutes=3)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    bank_id = req.bank_id.strip().lower()
    table_name = f"{bank_id}_database"
    clean_name = req.account_holder_name.strip().lower()
    clean_email = req.email.strip().lower()
    pwd_hash = hash_password(req.password)
    initial_balance = 100

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Please check database configuration."
        )

    bank_user_id = None
    balance = initial_balance

    try:
        # Check if email is already registered in DB
        existing = (
            supabase.table(table_name)
            .select("bank_user_id, status")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            ex_status = existing.data[0].get("status", "active")
            if ex_status == "on-hold":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account is on-hold with this bank. Please contact nautilus.project.00001@gmail.com to activate it."
                )
            raise HTTPException(
                status_code=400,
                detail=f"User already exists in {req.bank_id.upper()}. Please login instead."
            )

        # Generate unique 8-digit random user ID
        generated_id = generate_8digit_user_id(supabase, table_name)

        # Insert new account with initial balance ($100), active status, and 8-digit ID
        insert_res = (
            supabase.table(table_name)
            .insert({
                "bank_user_id": generated_id,
                "account_holder_name": clean_name,
                "email": clean_email,
                "password_hash": pwd_hash,
                "balance": balance,
                "status": "active",
            })
            .execute()
        )
        if insert_res.data and len(insert_res.data) > 0:
            bank_user_id = insert_res.data[0].get("bank_user_id", generated_id)
            balance = insert_res.data[0].get("balance", initial_balance)
        else:
            bank_user_id = generated_id
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"[SIGNUP DB INSERT ERROR]: {e}")
        # Try fallback insert if email/password_hash columns are pending migration
        try:
            fallback_id = generate_8digit_user_id(supabase, table_name)
            fallback_res = (
                supabase.table(table_name)
                .insert({
                    "bank_user_id": fallback_id,
                    "account_holder_name": clean_name,
                    "balance": initial_balance,
                })
                .execute()
            )
            if fallback_res.data and len(fallback_res.data) > 0:
                bank_user_id = fallback_res.data[0].get("bank_user_id", fallback_id)
            else:
                bank_user_id = fallback_id
        except Exception as e2:
            print(f"[SIGNUP DB FALLBACK ERROR]: {e2}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create account in {req.bank_id.upper()} database: {str(e)}"
            )

    if bank_user_id is None:
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve generated account ID from database."
        )

    # Generate OTP
    ok, otp_code, msg = generate_otp(clean_email, req.bank_id, ip)
    if not ok:
        raise HTTPException(status_code=429, detail=msg)

    # Dispatch OTP via Brevo
    try:
        await send_otp_email(clean_email, otp_code, clean_name, req.bank_id)
    except Exception as e:
        print(f"[SEND OTP EMAIL ERROR]: {e}")

    return AuthResponse(
        success=True,
        requires_otp=True,
        message="Account created! A 6-digit OTP has been sent to your email.",
        bank_user_id=bank_user_id,
        bank_id=req.bank_id.upper(),
        account_holder_name=clean_name,
        email=clean_email,
        balance=balance,
    )


@router.post("/login", response_model=AuthResponse)
async def custom_login(req: CustomLoginRequest, request: Request):
    """
    Verifies user credentials against the bank database and sends an OTP for 2FA.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=15, window_seconds=60, block_minutes=3)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    bank_id = req.bank_id.strip().lower()
    table_name = f"{bank_id}_database"
    clean_name = req.account_holder_name.strip().lower()
    clean_email = req.email.strip().lower()
    pwd_hash = hash_password(req.password)

    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable. Please try again shortly."
        )

    user_row = None
    try:
        # 1. Search by email
        res = (
            supabase.table(table_name)
            .select("*")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            user_row = res.data[0]
        else:
            # 2. Search by account name
            res_name = (
                supabase.table(table_name)
                .select("*")
                .ilike("account_holder_name", clean_name)
                .limit(1)
                .execute()
            )
            if res_name.data and len(res_name.data) > 0:
                user_row = res_name.data[0]
    except Exception as e:
        print(f"[LOGIN DB QUERY ERROR]: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed: {str(e)}"
        )

    if not user_row:
        raise HTTPException(
            status_code=401,
            detail="You don't have any accounts in this bank. Please choose another."
        )

    # Check on-hold status
    user_status = user_row.get("status", "active")
    if user_status == "on-hold":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is on-hold with this bank. Please contact nautilus.project.00001@gmail.com to activate it."
        )

    # Validate name
    db_name = user_row.get("account_holder_name", "").strip().lower()
    if db_name and db_name != clean_name:
        raise HTTPException(
            status_code=401,
            detail="Account holder name does not match bank records."
        )

    # Validate password hash if present
    stored_hash = user_row.get("password_hash")
    if stored_hash and stored_hash != pwd_hash and stored_hash != req.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid password. Please check your credentials."
        )

    # Credentials are valid -> Generate & Send OTP
    ok, otp_code, msg = generate_otp(clean_email, req.bank_id, ip)
    if not ok:
        raise HTTPException(status_code=429, detail=msg)

    try:
        await send_otp_email(clean_email, otp_code, clean_name, req.bank_id)
    except Exception as e:
        print(f"[SEND OTP EMAIL ERROR]: {e}")

    return AuthResponse(
        success=True,
        requires_otp=True,
        message="Verification OTP sent to your email.",
        bank_user_id=user_row.get("bank_user_id", 1),
        bank_id=req.bank_id.upper(),
        account_holder_name=clean_name,
        email=clean_email,
        balance=user_row.get("balance", 0),
        status=user_status,
    )


@router.post("/verify-otp", response_model=AuthResponse)
async def verify_otp_endpoint(req: OTPVerifyRequest, request: Request):
    """
    Verifies the OTP code for login or signup.
    Issues JWT session token and sends a security login alert email.
    """
    ip = get_client_ip(request)
    clean_email = req.email.strip().lower()
    bank_id = req.bank_id.strip().lower()

    ok, msg, remaining = verify_otp_code(clean_email, bank_id, req.otp_code, ip)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)

    # Fetch user row from DB
    supabase = get_supabase_client()
    table_name = f"{bank_id}_database"
    user_row = None

    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database service unavailable."
        )

    try:
        res = (
            supabase.table(table_name)
            .select("*")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            user_row = res.data[0]
        else:
            # Fallback by name if email not attached
            if req.account_holder_name:
                res_name = (
                    supabase.table(table_name)
                    .select("*")
                    .ilike("account_holder_name", req.account_holder_name.strip().lower())
                    .limit(1)
                    .execute()
                )
                if res_name.data and len(res_name.data) > 0:
                    user_row = res_name.data[0]
    except Exception as e:
        print(f"[VERIFY OTP DB LOOKUP ERROR]: {e}")
        raise HTTPException(status_code=500, detail=f"Database query failed: {str(e)}")

    if not user_row:
        raise HTTPException(
            status_code=404,
            detail="You don't have any accounts in this bank. Please choose another."
        )

    # Check on-hold status
    user_status = user_row.get("status", "active")
    if user_status == "on-hold":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is on-hold with this bank. Please contact nautilus.project.00001@gmail.com to activate it."
        )

    bank_user_id = user_row.get("bank_user_id")
    account_name = user_row.get("account_holder_name") or req.account_holder_name or "Account Holder"
    balance = user_row.get("balance", 0)

    # Issue JWT session token
    token = create_session_jwt(bank_id, bank_user_id, account_name, clean_email)

    # Send login notification email via Brevo
    try:
        await send_login_notification(clean_email, account_name, bank_id, ip_address=ip)
    except Exception as e:
        print(f"[SEND LOGIN NOTIFICATION WARNING]: {e}")

    return AuthResponse(
        success=True,
        message="Verification successful. Welcome to NAUTILUS.",
        access_token=token,
        bank_user_id=bank_user_id,
        bank_id=bank_id.upper(),
        account_holder_name=account_name,
        email=clean_email,
        balance=balance,
        status=user_status,
    )


@router.post("/resend-otp", response_model=AuthResponse)
async def resend_otp_endpoint(req: OTPResendRequest, request: Request):
    """
    Resends OTP code enforcing 1:30 cooldown timer and active IP blocks.
    """
    ip = get_client_ip(request)
    clean_email = req.email.strip().lower()
    bank_id = req.bank_id.strip().lower()

    # Blocked check
    blocked, reason, remaining = is_ip_blocked(ip)
    if blocked:
        mins = max(1, (remaining or 60) // 60)
        raise HTTPException(status_code=429, detail=f"Your IP is blocked. Please try again after {mins} minutes.")

    ok, otp_code, msg = generate_otp(clean_email, bank_id, ip)
    if not ok:
        raise HTTPException(status_code=429, detail=msg)

    name = req.account_holder_name or "Account Holder"
    try:
        await send_otp_email(clean_email, otp_code, name, bank_id)
    except Exception as e:
        print(f"[RESEND OTP EMAIL WARNING]: {e}")

    return AuthResponse(
        success=True,
        message="A new OTP code has been sent to your email.",
        bank_id=bank_id.upper(),
        email=clean_email,
    )


@router.post("/device", response_model=AuthResponse)
async def verify_device(req: AuthDeviceRequest):
    """
    Validates a JWT session token.
    """
    decoded = decode_session_jwt(req.token)
    if not decoded:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")

    return AuthResponse(
        success=True,
        message="Device & session verified successfully.",
        access_token=req.token,
        bank_user_id=decoded.get("bank_user_id"),
        bank_id=decoded.get("bank_id", "").upper(),
        account_holder_name=decoded.get("account_holder_name"),
        email=decoded.get("email"),
    )
