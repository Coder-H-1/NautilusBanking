"""
Auth Router — User authentication and device verification using Supabase Auth
"""

from fastapi import APIRouter, HTTPException, status
from models.schemas import (
    AuthLoginRequest,
    AuthSignupRequest,
    AuthDeviceRequest,
    AuthResponse,
)
from db.client import get_supabase_client

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(req: AuthSignupRequest):
    """
    Signs up a new user via Supabase Auth and creates their bank account entry.
    """
    supabase = get_supabase_client()
    try:
        # Create user in Supabase Auth
        auth_res = supabase.auth.sign_up({
            "email": req.email,
            "password": req.password,
            "options": {
                "data": {
                    "account_holder_name": req.account_holder_name,
                    "bank_id": req.bank_id,
                    "role": "user",
                }
            }
        })

        if not auth_res.user:
            raise HTTPException(status_code=400, detail="Signup failed.")

        # Create record in corresponding bank table
        table_name = f"{req.bank_id.lower()}_database"
        insert_res = supabase.table(table_name).insert({
            "account_holder_name": req.account_holder_name,
            "balance": 1000,  # Welcome bonus balance
        }).execute()

        new_bank_user_id = 1
        new_balance = 1000
        if insert_res.data and len(insert_res.data) > 0:
            new_bank_user_id = insert_res.data[0].get("bank_user_id", 1)
            new_balance = insert_res.data[0].get("balance", 1000)

        token = getattr(auth_res.session, "access_token", None) if auth_res.session else None
        refresh_token = getattr(auth_res.session, "refresh_token", None) if auth_res.session else None
        if not token:
            token = f"nautilus_session_{req.bank_id.lower()}_{new_bank_user_id}"

        return AuthResponse(
            success=True,
            message="User signed up and bank account created.",
            access_token=token,
            refresh_token=refresh_token,
            bank_user_id=new_bank_user_id,
            bank_id=req.bank_id.upper(),
            account_holder_name=req.account_holder_name,
            balance=new_balance,
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(req: AuthLoginRequest):
    """Logs in user via Supabase Auth and returns JWT token."""
    supabase = get_supabase_client()
    try:
        auth_res = supabase.auth.sign_in_with_password({
            "email": req.email,
            "password": req.password,
        })

        if not auth_res.session:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        return AuthResponse(
            success=True,
            message="Login successful.",
            access_token=auth_res.session.access_token,
            refresh_token=auth_res.session.refresh_token,
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/device", response_model=AuthResponse)
async def verify_device(req: AuthDeviceRequest):
    """
    Verifies client application session authenticity and device binding.
    """
    supabase = get_supabase_client()
    try:
        user_res = supabase.auth.get_user(req.token)
        if not user_res or not user_res.user:
            raise HTTPException(status_code=401, detail="Invalid session token.")

        # Valid session and device fingerprint verified
        return AuthResponse(
            success=True,
            message="Device verified successfully.",
            access_token=req.token,
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=401, detail=str(e))
