from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID


# ============================================
# Auth Schemas
# ============================================

class AuthLoginRequest(BaseModel):
    """Login request body."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")


class AuthSignupRequest(BaseModel):
    """Signup request body."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    account_holder_name: str = Field(..., min_length=1, description="Full name of the account holder")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID: cpb, eb, or sb")


class AuthDeviceRequest(BaseModel):
    """Device verification request body."""
    device_fingerprint: str = Field(..., description="Unique device identifier")
    token: str = Field(..., description="Session token to verify")


class AuthResponse(BaseModel):
    """Auth response body."""
    success: bool
    message: str
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    bank_user_id: Optional[int] = None
    bank_id: Optional[str] = None
    account_holder_name: Optional[str] = None
    balance: Optional[int] = None


# ============================================
# Bank Schemas
# ============================================

class BankInfo(BaseModel):
    """Single bank info."""
    name: str
    id: str


class BankListResponse(BaseModel):
    """Response for GET /bank."""
    banks: list[BankInfo]


class BankUserRequest(BaseModel):
    """Request to get user info from a bank."""
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")
    bank_user_id: int = Field(..., gt=0, description="User ID in the bank")


class BankUserResponse(BaseModel):
    """Response for bank user data."""
    success: bool
    account_holder_name: Optional[str] = None
    balance: Optional[int] = None
    bank_user_id: Optional[int] = None
    message: Optional[str] = None


class BankMoneyRequest(BaseModel):
    """Request from user to bank for money (bank-to-user transfer)."""
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")
    bank_user_id: int = Field(..., gt=0, description="User ID in the bank")
    amount: int = Field(..., gt=0, description="Amount to request")


# ============================================
# Transfer / Payment Schemas
# ============================================

class TransferRequest(BaseModel):
    """Request to initiate a money transfer (from PSP via /bank/req/sender)."""
    sender_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Sender's bank ID")
    sender_bank_user_id: int = Field(..., gt=0, description="Sender's user ID in bank")
    sender_account_holder_name: str = Field(..., min_length=1, description="Sender's name")
    receiver_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Receiver's bank ID")
    receiver_bank_user_id: int = Field(..., gt=0, description="Receiver's user ID in bank")
    amount: int = Field(..., gt=0, description="Amount to transfer")


class ReceiverInfoRequest(BaseModel):
    """Request to get receiver info (from ACPI via /bank/req/receiver)."""
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Receiver's bank ID")
    bank_user_id: int = Field(..., gt=0, description="Receiver's user ID")


class TransferResponse(BaseModel):
    """Response for a transfer operation."""
    success: bool
    transaction_id: Optional[UUID] = None
    message: str
    status: Optional[str] = None  # pending | success | failed


# ============================================
# ACPI Schemas
# ============================================

class ACPITransferRequest(BaseModel):
    """Request to ACPI to execute a transfer."""
    sender_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    sender_bank_user_id: int = Field(..., gt=0)
    receiver_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    receiver_bank_user_id: int = Field(..., gt=0)
    amount: int = Field(..., gt=0)


class ACPITransferResponse(BaseModel):
    """Response from ACPI after transfer."""
    success: bool
    transaction_id: Optional[UUID] = None
    message: str
    sender_new_balance: Optional[int] = None
    receiver_new_balance: Optional[int] = None


# ============================================
# QR Code Schemas
# ============================================

class QRGenerateRequest(BaseModel):
    """Request to generate a QR code."""
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    bank_user_id: int = Field(..., gt=0)


class QRResponse(BaseModel):
    """Response containing QR code data."""
    success: bool
    qr_image_base64: Optional[str] = None
    expires_at: Optional[str] = None
    message: Optional[str] = None


# ============================================
# Encryption Schemas
# ============================================

class EncryptedPayload(BaseModel):
    """Wrapper for encrypted API request/response data."""
    data: str = Field(..., description="Base64-encoded encrypted payload")
    signature: str = Field(..., description="HMAC-SHA256 signature for integrity verification")


# ============================================
# Common Schemas
# ============================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    service: str = "nautilus-banking-api"
    version: str = "1.0.0"


class ErrorResponse(BaseModel):
    """Standard error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
