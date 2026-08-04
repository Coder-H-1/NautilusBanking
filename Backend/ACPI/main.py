"""
ACPI (All Connected Payments Interface) Engine
Orchestrates inter-bank transactions via atomic double-ledger operations in Supabase.
"""

from typing import Dict, Any
from supabase.client import get_supabase_client
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
    ) -> Dict[str, Any]:
        """
        Executes atomic double-ledger transfer by invoking the Supabase RPC function 'transfer_money'.
        Both debiting sender and crediting receiver occur inside a single ACID database transaction.
        """
        # Step 1: Pre-validation of both accounts
        self.validate_accounts(
            sender_bank=sender_bank,
            sender_user_id=sender_user_id,
            receiver_bank=receiver_bank,
            receiver_user_id=receiver_user_id,
        )

        # Step 2: Invoke Supabase RPC transfer_money
        params = {
            "p_sender_bank": sender_bank.lower(),
            "p_sender_user_id": sender_user_id,
            "p_receiver_bank": receiver_bank.lower(),
            "p_receiver_user_id": receiver_user_id,
            "p_amount": amount,
        }

        rpc_res = self.supabase.rpc("transfer_money", params).execute()
        txn_id = rpc_res.data

        # Step 3: Fetch transaction record to confirm status
        txn_record = (
            self.supabase.table("transactions")
            .select("*")
            .eq("id", txn_id)
            .execute()
        )

        if not txn_record.data:
            raise RuntimeError(f"Transaction ID {txn_id} not recorded in ledger.")

        record = txn_record.data[0]
        if record.get("status") != "success":
            reason = record.get("failure_reason", "Transaction failed.")
            raise ValueError(f"ACPI transfer rejected: {reason}")

        return {
            "success": True,
            "transaction_id": txn_id,
            "status": "success",
            "message": "Double-ledger transfer settled successfully.",
        }
