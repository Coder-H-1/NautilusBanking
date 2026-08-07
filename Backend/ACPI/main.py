"""
ACPI (All Connected Payments Interface) Engine
Orchestrates inter-bank transactions via atomic double-ledger operations in Supabase.
"""

from typing import Dict, Any, Optional
from db.client import get_supabase_client
from bank.bank import Banks


class ACPITransactionEngine:
    """Core transaction engine for processing inter-bank money transfers."""

    def __init__(self):
        self.supabase = get_supabase_client()

    def validate_accounts(
        self,
        sender_bank: str,
        sender_user_id: int,
        receiver_bank: str,
        receiver_user_id: int,
    ) -> Dict[str, Any]:
        """
        Validates both sender and receiver accounts exist in their respective banks.
        """
        sender_helper = Banks(bank_id=sender_bank, bank_user_id=sender_user_id)
        sender_info = sender_helper.get_user_details()

        receiver_helper = Banks(bank_id=receiver_bank, bank_user_id=receiver_user_id)
        receiver_info = receiver_helper.get_user_details()

        return {
            "sender": sender_info,
            "receiver": receiver_info,
        }

    def execute_transfer(
        self,
        sender_bank: str,
        sender_user_id: int,
        receiver_bank: str,
        receiver_user_id: int,
        amount: int,
        sender_name: Optional[str] = None,
        receiver_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        ACPI acts as a medium of connection between banks.
        1. Pre-validates sender and receiver accounts across banks.
        2. Dispatches inter-bank transfer request to receiver/bank ledger via bank execution endpoint logic.
        3. Returns transaction ID and success status to sender's bank.
        """
        from bank.bank import execute_bank_transfer_request

        # Step 1: Pre-validation of both accounts
        account_details = self.validate_accounts(
            sender_bank=sender_bank,
            sender_user_id=sender_user_id,
            receiver_bank=receiver_bank,
            receiver_user_id=receiver_user_id,
        )

        resolved_sender_name = sender_name or account_details["sender"].get("account_holder_name", "")
        resolved_receiver_name = receiver_name or account_details["receiver"].get("account_holder_name", "")

        # Step 2: Request bank to execute the transfer and update amounts in database
        bank_result = execute_bank_transfer_request(
            sender_name=resolved_sender_name,
            sender_bank_id=sender_bank,
            sender_bank_user_id=sender_user_id,
            amount=amount,
            receiver_name=resolved_receiver_name,
            receiver_bank_id=receiver_bank,
            receiver_bank_user_id=receiver_user_id,
        )

        return {
            "success": True,
            "transaction_id": bank_result.get("transaction_id"),
            "status": bank_result.get("status", "success"),
            "message": "ACPI inter-bank transfer settled successfully.",
            "sender_new_balance": bank_result.get("sender_new_balance"),
            "receiver_new_balance": bank_result.get("receiver_new_balance"),
        }

