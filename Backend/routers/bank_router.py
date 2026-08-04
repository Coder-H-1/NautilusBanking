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
)
from bank.bank import bank_list, BankFunctions, Banks
from middleware.auth import verify_common, verify_protected

router = APIRouter(prefix="/bank", tags=["Bank"])


@router.get("", response_model=BankListResponse)
async def get_banks():
    """Returns list of all participating banks."""
    return BankListResponse(banks=bank_list())


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


@router.post("/userReq", response_model=BankUserResponse)
async def bank_user_faucet_request(
    req: BankMoneyRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Common/Authenticated route:
    Bank deposits requested funds to user's account up to a limit.
    """
    if req.amount > 100000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Requested amount exceeds single request limit of 100,000.",
        )

    try:
        from supabase.client import get_supabase_client
        supabase = get_supabase_client()
        table_name = f"{req.bank_id.lower()}_database"

        # Fetch current balance
        res = supabase.table(table_name).select("*").eq("bank_user_id", req.bank_user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User account not found.")

        current_balance = res.data[0]["balance"]
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
            message="Funds successfully credited by bank.",
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
