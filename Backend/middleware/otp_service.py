"""
NAUTILUS Banking System — OTP & IP Blocking Service
Handles OTP generation, attempt verification, IP blocking, rate limiting, and JWT tokens.
"""

import os
import random
import time
import jwt
from datetime import datetime, timedelta
from typing import Optional, Tuple
from config import supabase

JWT_SECRET = os.getenv("JWT_SECRET") or os.getenv("SUPABASE_JWT_SECRET") or "nautilus-banking-secure-jwt-secret-2026"
JWT_ALGORITHM = "HS256"

# In-memory backup cache in case DB has latency or for fast rate limiting
_ip_request_history: dict[str, list[float]] = {}
_in_memory_ip_blocks: dict[str, float] = {}  # ip -> unblock_timestamp
_in_memory_otps: dict[str, dict] = {}  # f"{email}:{bank_id}" -> {code, expires_at, attempts, created_at}


def get_client_ip(request) -> str:
    """Extract real client IP address considering reverse proxies like Vercel / Cloudflare."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


def is_ip_blocked(ip: str) -> Tuple[bool, Optional[str], Optional[int]]:
    """
    Checks if an IP is currently blocked either in memory or database.
    Returns (is_blocked, reason, seconds_remaining).
    """
    now = time.time()
    # Check in-memory first
    if ip in _in_memory_ip_blocks:
        unblock_time = _in_memory_ip_blocks[ip]
        if now < unblock_time:
            remaining = int(unblock_time - now)
            return True, "IP is temporarily blocked due to security limits", remaining
        else:
            del _in_memory_ip_blocks[ip]

    # Check database
    try:
        res = (
            supabase.table("ip_blocks")
            .select("*")
            .eq("ip_address", ip)
            .gt("blocked_until", datetime.utcnow().isoformat())
            .order("blocked_until", desc=True)
            .limit(1)
            .execute()
        )
        if res.data and len(res.data) > 0:
            block_data = res.data[0]
            # parse remaining time
            blocked_until = datetime.fromisoformat(block_data["blocked_until"].replace("Z", "+00:00"))
            remaining = max(1, int((blocked_until.timestamp() - datetime.utcnow().timestamp())))
            _in_memory_ip_blocks[ip] = now + remaining
            return True, block_data.get("reason", "IP blocked"), remaining
    except Exception as e:
        print("[IP BLOCK DB CHECK ERROR]", e)

    return False, None, None


def block_ip(ip: str, minutes: int, reason: str):
    """Block an IP address for the specified number of minutes."""
    unblock_time = time.time() + (minutes * 60)
    _in_memory_ip_blocks[ip] = unblock_time
    blocked_until_iso = (datetime.utcnow() + timedelta(minutes=minutes)).isoformat()

    try:
        supabase.table("ip_blocks").insert({
            "ip_address": ip,
            "blocked_until": blocked_until_iso,
            "reason": reason
        }).execute()
    except Exception as e:
        print("[IP BLOCK INSERT ERROR]", e)


def check_rate_limit(ip: str, max_requests: int = 10, window_seconds: int = 60, block_minutes: int = 3) -> Tuple[bool, Optional[str]]:
    """
    Rate limiting: If > max_requests in window_seconds, block IP for block_minutes.
    Returns (allowed, error_message).
    """
    blocked, reason, remaining = is_ip_blocked(ip)
    if blocked:
        mins = max(1, (remaining or 60) // 60)
        return False, f"Too many requests made from one source. Please try again in {mins} minutes."

    now = time.time()
    history = _ip_request_history.get(ip, [])
    # filter timestamps within window
    history = [t for t in history if now - t < window_seconds]
    history.append(now)
    _ip_request_history[ip] = history

    if len(history) > max_requests:
        block_ip(ip, block_minutes, "Rate limit exceeded (too many requests)")
        return False, f"Too many requests made from one source. Please try again in {block_minutes} minutes."

    return True, None


def generate_otp(email: str, bank_id: str, ip: str) -> Tuple[bool, str, str]:
    """
    Generates a 6-digit OTP, stores it, and enforces the 90s resend cooldown.
    Returns (success, otp_code_or_error, message).
    """
    blocked, reason, remaining = is_ip_blocked(ip)
    if blocked:
        mins = max(1, (remaining or 60) // 60)
        return False, "", f"Your IP is blocked. Please try again in {mins} minutes."

    now = time.time()
    cache_key = f"{email.strip().lower()}:{bank_id.strip().lower()}"

    # Check 1:30 (90s) cooldown
    if cache_key in _in_memory_otps:
        last_created = _in_memory_otps[cache_key].get("created_at", 0)
        if now - last_created < 90:
            remaining_cooldown = int(90 - (now - last_created))
            return False, "", f"Please wait {remaining_cooldown} seconds before requesting a new OTP."

    # Generate 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at_time = now + 180  # 3 minutes
    expires_at_iso = (datetime.utcnow() + timedelta(minutes=3)).isoformat()

    _in_memory_otps[cache_key] = {
        "code": otp_code,
        "expires_at": expires_at_time,
        "attempts": 0,
        "created_at": now,
        "ip": ip
    }

    try:
        # Invalidate old OTPs for this email+bank
        supabase.table("otp_codes").update({"is_verified": True}).eq("email", email.strip().lower()).eq("bank_id", bank_id.strip().lower()).execute()
        # Insert new
        supabase.table("otp_codes").insert({
            "email": email.strip().lower(),
            "bank_id": bank_id.strip().lower(),
            "otp_code": otp_code,
            "attempts": 0,
            "is_verified": False,
            "ip_address": ip,
            "expires_at": expires_at_iso
        }).execute()
    except Exception as e:
        print("[OTP DB INSERT ERROR]", e)

    return True, otp_code, "OTP generated successfully"


def verify_otp_code(email: str, bank_id: str, input_code: str, ip: str) -> Tuple[bool, str, int]:
    """
    Verifies the OTP code.
    Returns (success, message, remaining_attempts).
    If 3 failed attempts occur, blocks IP for 5 minutes.
    """
    blocked, reason, remaining = is_ip_blocked(ip)
    if blocked:
        mins = max(1, (remaining or 60) // 60)
        return False, f"Please try again after {mins} minutes.", 0

    now = time.time()
    cache_key = f"{email.strip().lower()}:{bank_id.strip().lower()}"
    otp_data = _in_memory_otps.get(cache_key)

    # Fallback to DB if not in memory
    if not otp_data:
        try:
            res = (
                supabase.table("otp_codes")
                .select("*")
                .eq("email", email.strip().lower())
                .eq("bank_id", bank_id.strip().lower())
                .eq("is_verified", False)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if res.data and len(res.data) > 0:
                row = res.data[0]
                exp_dt = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
                otp_data = {
                    "code": row["otp_code"],
                    "expires_at": exp_dt.timestamp(),
                    "attempts": row.get("attempts", 0),
                    "created_at": datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")).timestamp(),
                    "db_id": row["id"]
                }
                _in_memory_otps[cache_key] = otp_data
        except Exception as e:
            print("[OTP DB LOOKUP ERROR]", e)

    if not otp_data:
        return False, "No active OTP found. Please request a new code.", 0

    # Check expiration (3 minutes)
    if now > otp_data["expires_at"]:
        _in_memory_otps.pop(cache_key, None)
        return False, "OTP has expired (3 minutes limit). Please request a new code.", 0

    # Check matching
    if input_code.strip() == otp_data["code"]:
        # Success!
        _in_memory_otps.pop(cache_key, None)
        try:
            if "db_id" in otp_data:
                supabase.table("otp_codes").update({"is_verified": True}).eq("id", otp_data["db_id"]).execute()
            else:
                supabase.table("otp_codes").update({"is_verified": True}).eq("email", email.strip().lower()).eq("bank_id", bank_id.strip().lower()).execute()
        except Exception as e:
            print("[OTP DB VERIFY UPDATE ERROR]", e)
        return True, "Verification successful", 3

    # Incorrect code -> increment attempts
    otp_data["attempts"] += 1
    attempts = otp_data["attempts"]
    remaining_tries = 3 - attempts

    try:
        supabase.table("otp_codes").update({"attempts": attempts}).eq("email", email.strip().lower()).eq("bank_id", bank_id.strip().lower()).execute()
    except Exception as e:
        print("[OTP ATTEMPTS UPDATE ERROR]", e)

    if remaining_tries <= 0:
        _in_memory_otps.pop(cache_key, None)
        block_ip(ip, minutes=5, reason="Failed OTP attempts (3 tries exceeded)")
        return False, "Maximum attempts exceeded. Please try again after 5 minutes.", 0

    return False, f"Invalid OTP code. {remaining_tries} {'try' if remaining_tries == 1 else 'tries'} left.", remaining_tries


def create_session_jwt(bank_id: str, bank_user_id: int, account_holder_name: str, email: str) -> str:
    """Create a signed JWT session token valid for 24 hours."""
    payload = {
        "sub": str(bank_user_id),
        "bank_user_id": bank_user_id,
        "bank_id": bank_id.lower(),
        "account_holder_name": account_holder_name.lower(),
        "email": email.lower(),
        "exp": datetime.utcnow() + timedelta(hours=24),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_session_jwt(token: str) -> Optional[dict]:
    """Decode and verify a JWT session token."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except Exception:
        return None
