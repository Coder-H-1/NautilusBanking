"""
NAUTILUS Banking System — Custom Auth Router
Full custom authentication with account verification, Brevo OTP dispatch,
rate limiting, IP blocking, and JWT session handling (replaces Supabase Auth).
"""

import hashlib
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


@router.post("/check-email", response_model=CheckEmailResponse)
async def check_email_exists(req: CheckEmailRequest, request: Request):
    """
    Checks whether an email is already registered in the specified bank database.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=25, window_seconds=60, block_minutes=3)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    supabase = get_supabase_client()
    table_name = f"{req.bank_id.lower()}_database"
    clean_email = req.email.strip().lower()

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
        return CheckEmailResponse(
            success=True,
            exists=False,
            message="Email available for registration."
        )
    except Exception as e:
        print("[CHECK EMAIL ERROR]", e)
        return CheckEmailResponse(
            success=True,
            exists=False,
            message="Email check completed."
        )


@router.post("/signup", response_model=AuthResponse)
async def custom_signup(req: CustomSignupRequest, request: Request):
    """
    Creates a new user in the bank table and dispatches an OTP verification email.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=10, window_seconds=60, block_minutes=3)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    supabase = get_supabase_client()
    table_name = f"{req.bank_id.lower()}_database"
    clean_name = req.account_holder_name.strip().lower()
    clean_email = req.email.strip().lower()

    try:
        # Check if email already registered
        existing = (
            supabase.table(table_name)
            .select("bank_user_id")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )
        if existing.data and len(existing.data) > 0:
            raise HTTPException(
                status_code=400,
                detail=f"User already exists in {req.bank_id.upper()}. Please login instead."
            )

        pwd_hash = hash_password(req.password)

        # Insert new account with initial balance of 1000
        insert_res = (
            supabase.table(table_name)
            .insert({
                "account_holder_name": clean_name,
                "email": clean_email,
                "password_hash": pwd_hash,
                "balance": 1000,
            })
            .execute()
        )

        bank_user_id = 1
        balance = 1000
        if insert_res.data and len(insert_res.data) > 0:
            bank_user_id = insert_res.data[0].get("bank_user_id", 1)
            balance = insert_res.data[0].get("balance", 1000)

        # Generate OTP
        ok, otp_code, msg = generate_otp(clean_email, req.bank_id, ip)
        if not ok:
            raise HTTPException(status_code=429, detail=msg)

        # Dispatch OTP via Brevo
        await send_otp_email(clean_email, otp_code, clean_name, req.bank_id)

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
    except HTTPException as he:
        raise he
    except Exception as e:
        print("[SIGNUP EXCEPTION]", e)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def custom_login(req: CustomLoginRequest, request: Request):
    """
    Verifies user credentials against the bank database and sends an OTP for 2FA.
    """
    ip = get_client_ip(request)
    allowed, limit_err = check_rate_limit(ip, max_requests=10, window_seconds=60, block_minutes=3)
    if not allowed:
        raise HTTPException(status_code=429, detail=limit_err)

    supabase = get_supabase_client()
    table_name = f"{req.bank_id.lower()}_database"
    clean_name = req.account_holder_name.strip().lower()
    clean_email = req.email.strip().lower()
    pwd_hash = hash_password(req.password)

    try:
        # Check credentials in specific bank table
        res = (
            supabase.table(table_name)
            .select("*")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )

        if not res.data or len(res.data) == 0:
            raise HTTPException(
                status_code=401,
                detail=f"No account found with this email in {req.bank_id.upper()}."
            )

        user_row = res.data[0]
        # Match name (case-insensitive)
        if user_row.get("account_holder_name", "").strip().lower() != clean_name:
            raise HTTPException(
                status_code=401,
                detail="Account holder name does not match bank records."
            )

        # Match password hash
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

        await send_otp_email(clean_email, otp_code, clean_name, req.bank_id)

        return AuthResponse(
            success=True,
            requires_otp=True,
            message="Verification OTP sent to your email.",
            bank_user_id=user_row.get("bank_user_id"),
            bank_id=req.bank_id.upper(),
            account_holder_name=clean_name,
            email=clean_email,
            balance=user_row.get("balance", 0),
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        print("[LOGIN EXCEPTION]", e)
        raise HTTPException(status_code=400, detail=str(e))


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

    # Fetch user row from bank database
    supabase = get_supabase_client()
    table_name = f"{bank_id}_database"

    try:
        res = (
            supabase.table(table_name)
            .select("*")
            .eq("email", clean_email)
            .limit(1)
            .execute()
        )

        if not res.data or len(res.data) == 0:
            raise HTTPException(status_code=404, detail="User account record not found.")

        user_row = res.data[0]
        bank_user_id = user_row.get("bank_user_id", 1)
        account_name = user_row.get("account_holder_name", req.account_holder_name or "Account Holder")
        balance = user_row.get("balance", 0)

        # Issue JWT session token
        token = create_session_jwt(bank_id, bank_user_id, account_name, clean_email)

        # Send login notification email
        await send_login_notification(clean_email, account_name, bank_id, ip_address=ip)

        return AuthResponse(
            success=True,
            message="Verification successful. Welcome to NAUTILUS.",
            access_token=token,
            bank_user_id=bank_user_id,
            bank_id=bank_id.upper(),
            account_holder_name=account_name,
            email=clean_email,
            balance=balance,
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        print("[VERIFY OTP EXCEPTION]", e)
        raise HTTPException(status_code=400, detail=str(e))


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
    await send_otp_email(clean_email, otp_code, name, bank_id)

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
