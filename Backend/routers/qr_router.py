"""
QR Code Router — Generates and rotates encrypted payment/faucet QR codes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import QRResponse, QRGenerateRequest
from qr_service.QrCodeMaker import QRCodeMaker
from middleware.auth import verify_common

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
