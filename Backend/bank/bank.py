"""
NAUTILUS Banking System — Bank Logic & Management
Handles bank user accounts, validation, and transfer dispatch.
"""

from typing import Optional, Dict, Any, List
from db.client import get_supabase_client

BANKS: List[Dict[str, str]] = [
    {
        "name": "Common People's Bank",
        "id": "cpb",
    },
    {
        "name": "Elses Bank",
        "id": "eb",
    },
    {
        "name": "SomeBank",
        "id": "sb",
    },
]


def bank_list() -> List[Dict[str, str]]:
    """Returns the list of supported banks."""
    return BANKS


class BankFunctions:
    """Handles bank-side validation, user account lookup, and ACPI interaction."""

    def __init__(
        self,
        sender_account_holder_name: str,
        sender_bank_id: str,
        sender_bank_user_id: int,
        receiver_bank_id: str,
        receiver_bank_user_id: int,
        amount: int,
    ):
        self.sender_account_holder_name = sender_account_holder_name
        self.sender_bank_id = sender_bank_id.lower()
        self.sender_bank_user_id = sender_bank_user_id
        self.receiver_bank_id = receiver_bank_id.lower()
        self.receiver_bank_user_id = receiver_bank_user_id
        self.amount = amount

    def get_user_data(
        self,
        bank_id: str,
        bank_user_id: int,
        account_holder_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Fetches user data (balance, account holder name) from the bank table in Supabase.
        Table name format: {bank_id}_database
        """
        table_name = f"{bank_id.lower()}_database"
        supabase = get_supabase_client()

        query = supabase.table(table_name).select("*").eq("bank_user_id", bank_user_id)
        if account_holder_name:
            query = query.ilike("account_holder_name", account_holder_name)

        response = query.execute()
        if not response.data or len(response.data) == 0:
            raise ValueError(
                f"No account found in bank '{bank_id.upper()}' for user ID {bank_user_id}."
            )

        return response.data[0]

    def validate_amount(self) -> bool:
        """
        Validates whether the sender has sufficient balance for the requested transfer.
        """
        sender_data = self.get_user_data(
            bank_id=self.sender_bank_id,
            bank_user_id=self.sender_bank_user_id,
            account_holder_name=self.sender_account_holder_name,
        )
        current_balance = sender_data.get("balance", 0)
        if current_balance < self.amount:
            raise ValueError(
                f"Insufficient balance. Available: {current_balance}, Required: {self.amount}"
            )
        return True

    def call_ACPI(self) -> Dict[str, Any]:
        """
        Calls ACPI transaction executor to perform the atomic double-ledger transfer.
        """
        from ACPI.main import ACPITransactionEngine

        acpi = ACPITransactionEngine()
        result = acpi.execute_transfer(
            sender_bank=self.sender_bank_id,
            sender_user_id=self.sender_bank_user_id,
            receiver_bank=self.receiver_bank_id,
            receiver_user_id=self.receiver_bank_user_id,
            amount=self.amount,
        )
        return result

    def update_money(self) -> Dict[str, Any]:
        """
        Fetches the updated sender user data from Supabase post-transfer.
        """
        return self.get_user_data(
            bank_id=self.sender_bank_id,
            bank_user_id=self.sender_bank_user_id,
        )

    def initiate_money_transfer(self) -> Dict[str, Any]:
        """
        Full orchestration of transfer from the Bank side:
        1. Validate sender balance
        2. Dispatch to ACPI for ACID transfer
        3. Retrieve updated balance
        """
        self.validate_amount()
        acpi_result = self.call_ACPI()
        updated_sender = self.update_money()

        return {
            "success": True,
            "transaction_id": acpi_result.get("transaction_id"),
            "status": acpi_result.get("status"),
            "sender_new_balance": updated_sender.get("balance"),
            "message": "Transfer processed successfully.",
        }


class Banks:
    """Bank helper class for retrieving user and bank information."""

    def __init__(
        self,
        account_holder_name: Optional[str] = None,
        bank_id: str = "cpb",
        bank_user_id: int = 0,
    ):
        self.account_holder_name = account_holder_name
        self.bank_id = bank_id.lower()
        self.bank_user_id = bank_user_id

        if self.bank_id not in self.get_bank_list():
            raise ValueError(f"Invalid bank ID: '{bank_id}'. Must be one of {self.get_bank_list()}")

    @staticmethod
    def get_bank_list() -> List[str]:
        """Returns list of valid bank IDs."""
        return [b["id"] for b in bank_list()]

    def get_user_details(self) -> Dict[str, Any]:
        """Fetches account details for this bank user from Supabase."""
        if self.bank_user_id <= 0:
            raise ValueError("Invalid bank_user_id.")

        table_name = f"{self.bank_id}_database"
        supabase = get_supabase_client()
        res = supabase.table(table_name).select("*").eq("bank_user_id", self.bank_user_id).execute()

        if not res.data or len(res.data) == 0:
            raise ValueError(f"Account not found in bank '{self.bank_id.upper()}'.")

        return res.data[0]
