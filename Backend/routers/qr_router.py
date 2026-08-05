"""
QR Code Router — Generates and rotates encrypted payment/faucet QR codes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import (
    QRResponse,
    QRGenerateRequest,
    FaucetQRGenerateRequest,
    FaucetQRResponse,
    FaucetClaimRequest,
    BankUserResponse,
)
from qr_service.QrCodeMaker import QRCodeMaker
from middleware.auth import verify_common
from routers.bank_router import check_and_increment_faucet_limit, MAX_ACCOUNT_BALANCE, FAUCET_MAX_AMOUNT

router = APIRouter(prefix="/qr", tags=["QR Code"])


@router.post("/generate", response_model=QRResponse)
async def generate_qr_code(
    req: QRGenerateRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Generates a timed (2-minute), encrypted QR code for requesting funds from bank.
    """
    try:
        maker = QRCodeMaker(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        result = maker.create()
        return QRResponse(
            success=True,
            qr_image_base64=result.get("qr_image_base64"),
            expires_at=result.get("expires_at"),
            message="QR code created. Valid for 2 minutes.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/update", response_model=QRResponse)
async def update_qr_code(
    req: QRGenerateRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Refreshes QR code for active users after timeout.
    """
    try:
        maker = QRCodeMaker(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        result = maker.update()
        return QRResponse(
            success=True,
            qr_image_base64=result.get("qr_image_base64"),
            expires_at=result.get("expires_at"),
            message="QR code refreshed with new 2-minute validity.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/faucet/generate", response_model=FaucetQRResponse)
async def generate_faucet_qr(
    req: FaucetQRGenerateRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Generates a timed, claimable Faucet QR code for depositing up to $500.
    """
    if req.amount > FAUCET_MAX_AMOUNT or req.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Amount must be between $1 and ${FAUCET_MAX_AMOUNT} per request.",
        )

    try:
        maker = QRCodeMaker(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        result = maker.create_faucet_qr(amount=req.amount)
        return FaucetQRResponse(
            success=True,
            token=result.get("token"),
            amount=req.amount,
            qr_image_base64=result.get("qr_image_base64"),
            expires_at=result.get("expires_at"),
            message=f"Faucet QR generated for ${req.amount:,}. Valid for 2 minutes.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/faucet/claim", response_model=BankUserResponse)
async def claim_faucet_qr_code(
    req: FaucetClaimRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Claims funds encoded in a scanned Faucet QR code and credits user balance.
    """
    ok, amount, msg = QRCodeMaker.claim_faucet_qr(
        token=req.token,
        bank_id=req.bank_id,
        bank_user_id=req.bank_user_id,
    )
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    # Check daily limit and increment
    allowed, limit_msg = check_and_increment_faucet_limit(req.bank_id, req.bank_user_id)
    if not allowed:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=limit_msg)

    try:
        from db.client import get_supabase_client
        supabase = get_supabase_client()
        table_name = f"{req.bank_id.lower()}_database"

        # Fetch current balance
        res = supabase.table(table_name).select("*").eq("bank_user_id", req.bank_user_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User account not found.")

        current_balance = res.data[0]["balance"]
        if current_balance + amount > MAX_ACCOUNT_BALANCE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Account balance cannot exceed ${MAX_ACCOUNT_BALANCE:,} limit.",
            )

        new_balance = current_balance + amount

        # Update balance
        supabase.table(table_name).update({"balance": new_balance}).eq("bank_user_id", req.bank_user_id).execute()

        return BankUserResponse(
            success=True,
            account_holder_name=res.data[0]["account_holder_name"],
            balance=new_balance,
            bank_user_id=req.bank_user_id,
            message=f"${amount:,} claimed successfully via QR scan!",
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
