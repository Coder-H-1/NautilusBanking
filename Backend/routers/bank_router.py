"""
Bank Router — Implements bank endpoints for client apps and ACPI
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import (
    BankListResponse,
    BankUserRequest,
    BankUserResponse,
    TransferRequest,
    TransferResponse,
    ReceiverInfoRequest,
    BankMoneyRequest,
    BankTransferRequest,
    BankTransferResponse,
)
from bank.bank import bank_list, BankFunctions, Banks, execute_bank_transfer_request
from middleware.auth import verify_common, verify_protected

router = APIRouter(prefix="/bank", tags=["Bank"])


@router.get("", response_model=BankListResponse)
async def get_banks():
    """Returns list of all participating banks."""
    return BankListResponse(banks=bank_list())


@router.post("/request", response_model=BankTransferResponse)
async def handle_bank_transfer_request(
    req: BankTransferRequest,
    auth_data: dict = Depends(verify_protected),
):
    """
    Protected route:
    Used by ACPI to instruct participating banks to execute balance updates
    and record transactions within their respective ledgers.
    """
    try:
        res = execute_bank_transfer_request(
            sender_name=req.sender_name,
            sender_bank_id=req.sender_bank_id,
            sender_bank_user_id=req.sender_bank_user_id,
            amount=req.amount,
            receiver_name=req.receiver_name,
            receiver_bank_id=req.receiver_bank_id,
            receiver_bank_user_id=req.receiver_bank_user_id,
        )
        return BankTransferResponse(
            success=res["success"],
            transaction_id=res.get("transaction_id"),
            status=res.get("status", "success"),
            message=res.get("message", "Bank transfer request settled."),
            sender_new_balance=res.get("sender_new_balance"),
            receiver_new_balance=res.get("receiver_new_balance"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/req", response_model=BankUserResponse)
async def get_bank_user_info(
    req: BankUserRequest,
    auth_data: dict = Depends(verify_protected),
):
    """
    Protected route:
    Used by ACPI and Bank to look up account details of a user.
    """
    try:
        bank_helper = Banks(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        user_info = bank_helper.get_user_details()
        return BankUserResponse(
            success=True,
            account_holder_name=user_info.get("account_holder_name"),
            balance=user_info.get("balance"),
            bank_user_id=user_info.get("bank_user_id"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.post("/req/sender", response_model=TransferResponse)
async def initiate_sender_payment(
    req: TransferRequest,
    auth_data: dict = Depends(verify_protected),
):
    """
    Protected route:
    Used by PSP client to initiate payment via sender's bank.
    """
    try:
        executor = BankFunctions(
            sender_account_holder_name=req.sender_account_holder_name,
            sender_bank_id=req.sender_bank_id,
            sender_bank_user_id=req.sender_bank_user_id,
            receiver_bank_id=req.receiver_bank_id,
            receiver_bank_user_id=req.receiver_bank_user_id,
            amount=req.amount,
        )
        res = executor.initiate_money_transfer()
        return TransferResponse(
            success=res["success"],
            transaction_id=res.get("transaction_id"),
            status=res.get("status"),
            message=res.get("message", "Payment initiated."),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/req/receiver", response_model=BankUserResponse)
async def get_receiver_info(
    req: ReceiverInfoRequest,
    auth_data: dict = Depends(verify_protected),
):
    """
    Protected route:
    Used by ACPI to verify receiver account details before transferring funds.
    """
    try:
        bank_helper = Banks(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        user_info = bank_helper.get_user_details()
        return BankUserResponse(
            success=True,
            account_holder_name=user_info.get("account_holder_name"),
            balance=user_info.get("balance"),
            bank_user_id=user_info.get("bank_user_id"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


import datetime
from typing import Dict, Any

FAUCET_USAGE: Dict[str, Dict[str, Any]] = {}
FAUCET_DAILY_LIMIT = 10
FAUCET_MAX_AMOUNT = 500
MAX_ACCOUNT_BALANCE = 100_000_000


def check_and_increment_faucet_limit(bank_id: str, bank_user_id: int) -> tuple[bool, str]:
    """Ensures a user does not exceed 10 faucet requests per day."""
    today = datetime.date.today().isoformat()
    key = f"{bank_id.lower()}_{bank_user_id}"
    usage = FAUCET_USAGE.get(key)
    if not usage or usage.get("date") != today:
        FAUCET_USAGE[key] = {"date": today, "count": 1}
        return True, ""
    if usage["count"] >= FAUCET_DAILY_LIMIT:
        return False, f"Daily limit reached ({FAUCET_DAILY_LIMIT} requests/day). Please try again tomorrow."
    usage["count"] += 1
    return True, ""


@router.post("/userReq", response_model=BankUserResponse)
async def bank_user_faucet_request(
    req: BankMoneyRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Common/Authenticated route:
    Bank deposits requested funds to user's account up to $500 per request,
    max 10 requests per day, capped at $100 Million balance.
    """
    if req.amount > FAUCET_MAX_AMOUNT or req.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested amount must be between $1 and ${FAUCET_MAX_AMOUNT} per request.",
        )

    allowed, limit_msg = check_and_increment_faucet_limit(req.bank_id, req.bank_user_id)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=limit_msg,
        )

    try:
        from db.client import get_supabase_client
        supabase = get_supabase_client()
        table_name = f"{req.bank_id.lower()}_database"

        # Fetch current balance
        res = supabase.table(table_name).select("*").eq("bank_user_id", req.bank_user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User account not found.")

        current_balance = res.data[0]["balance"]
        if current_balance + req.amount > MAX_ACCOUNT_BALANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Account balance cannot exceed ${MAX_ACCOUNT_BALANCE:,} limit.",
            )

        new_balance = current_balance + req.amount

        # Update balance
        update_res = (
            supabase.table(table_name)
            .update({"balance": new_balance})
            .eq("bank_user_id", req.bank_user_id)
            .execute()
        )

        return BankUserResponse(
            success=True,
            account_holder_name=res.data[0]["account_holder_name"],
            balance=new_balance,
            bank_user_id=req.bank_user_id,
            message=f"${req.amount:,} funds successfully credited by bank faucet.",
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
