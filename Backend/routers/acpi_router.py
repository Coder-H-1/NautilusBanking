"""
ACPI Router — Protected endpoint for inter-bank transaction settlement
"""

from fastapi import APIRouter, Depends, HTTPException, status
from models.schemas import ACPITransferRequest, ACPITransferResponse
from ACPI.main import ACPITransactionEngine
from middleware.auth import verify_protected

router = APIRouter(prefix="/ACPI", tags=["ACPI"])


@router.post("", response_model=ACPITransferResponse)
async def process_acpi_transfer(
    req: ACPITransferRequest,
    auth_data: dict = Depends(verify_protected),
):
    """
    Protected route:
    Only accessible by Bank / Service accounts.
    Executes inter-bank atomic double-ledger transfer.
    """
    try:
        engine = ACPITransactionEngine()
        result = engine.execute_transfer(
            sender_bank=req.sender_bank_id,
            sender_user_id=req.sender_bank_user_id,
            receiver_bank=req.receiver_bank_id,
            receiver_user_id=req.receiver_bank_user_id,
            amount=req.amount,
            sender_name=req.sender_name,
            receiver_name=req.receiver_name,
        )

        return ACPITransferResponse(
            success=True,
            transaction_id=result.get("transaction_id"),
            status=result.get("status", "success"),
            message=result.get("message", "ACPI settlement successful."),
            sender_new_balance=result.get("sender_new_balance"),
            receiver_new_balance=result.get("receiver_new_balance"),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
