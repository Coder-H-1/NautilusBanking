"""
QR Code Router — Generates and rotates encrypted payment/faucet QR codes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import (
    QRResponse,
    QRGenerateRequest,
    QRShareGenerateRequest,
    QRTransferGenerateRequest,
    QRDecodeRequest,
    QRDecodeResponse,
    FaucetQRGenerateRequest,
    FaucetQRResponse,
    FaucetClaimRequest,
    BankUserResponse,
)
from qr_service.QrCodeMaker import QRCodeMaker
from middleware.auth import verify_common
from routers.bank_router import check_and_increment_faucet_limit, MAX_ACCOUNT_BALANCE, FAUCET_MAX_AMOUNT

router = APIRouter(prefix="/qr", tags=["QR Code"])


@router.post("/generate/share", response_model=QRResponse)
async def generate_share_qr(
    req: QRShareGenerateRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Generates a timed (2-minute), encrypted Type-1 QR code for sharing account information.
    """
    try:
        maker = QRCodeMaker(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        result = maker.create_share_qr(account_holder_name=req.account_holder_name)
        return QRResponse(
            success=True,
            qr_image_base64=result.get("qr_image_base64"),
            expires_at=result.get("expires_at"),
            message="Share QR code created. Valid for 2 minutes.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/generate/transfer", response_model=QRResponse)
async def generate_transfer_qr(
    req: QRTransferGenerateRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Generates a timed (2-minute), encrypted Type-2 QR code for receiving funds.
    """
    try:
        maker = QRCodeMaker(bank_id=req.bank_id, bank_user_id=req.bank_user_id)
        result = maker.create_transfer_qr(account_holder_name=req.account_holder_name, amount=req.amount)
        return QRResponse(
            success=True,
            qr_image_base64=result.get("qr_image_base64"),
            expires_at=result.get("expires_at"),
            message="Transfer QR code created. Valid for 2 minutes.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/decode", response_model=QRDecodeResponse)
async def decode_qr(
    req: QRDecodeRequest,
    auth_data: dict = Depends(verify_common),
):
    """
    Decodes and validates a QR payload.
    """
    decoded = QRCodeMaker.decode_qr(req.encrypted_data)
    if not decoded.get("valid"):
        return QRDecodeResponse(
            success=False,
            valid=False,
            message=decoded.get("message", "Invalid QR code")
        )
        
    return QRDecodeResponse(
        success=True,
        valid=True,
        type=decoded.get("type"),
        bank_id=decoded.get("bank_id"),
        bank_user_id=decoded.get("bank_user_id"),
        account_holder_name=decoded.get("account_holder_name"),
        amount=decoded.get("amount")
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
        result = maker.create_faucet_qr(account_holder_name=req.account_holder_name, amount=req.amount)
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
