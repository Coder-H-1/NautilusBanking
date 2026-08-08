from pydantic import BaseModel, Field, validator
from typing import Optional
from uuid import UUID
import re


# ============================================
# Custom Auth & Security Schemas
# ============================================

class CustomLoginRequest(BaseModel):
    """Login request with account name, email, bank, and password."""
    account_holder_name: str = Field(..., min_length=1, description="Account holder full name")
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID: cpb, eb, or sb")
    password: str = Field(..., min_length=6, description="User password or client-side hash")

    @validator("account_holder_name")
    def validate_name(cls, v):
        # Case insensitive (lowercase preferred), no signs or numbers
        cleaned = v.strip().lower()
        if not re.match(r"^[a-zA-Z\s]+$", cleaned):
            raise ValueError("Account holder name must contain only letters and spaces (no numbers or symbols)")
        return cleaned


class CustomSignupRequest(BaseModel):
    """Signup request with account name, email, bank, and password."""
    account_holder_name: str = Field(..., min_length=1, description="Account holder full name")
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID: cpb, eb, or sb")
    password: str = Field(..., min_length=6, description="User password or client-side hash")

    @validator("account_holder_name")
    def validate_name(cls, v):
        cleaned = v.strip().lower()
        if not re.match(r"^[a-zA-Z\s]+$", cleaned):
            raise ValueError("Account holder name must contain only letters and spaces (no numbers or symbols)")
        return cleaned

    @validator("email")
    def validate_email(cls, v):
        email_clean = v.strip().lower()
        if "@" not in email_clean or "." not in email_clean:
            raise ValueError("Invalid email format")
        return email_clean


class OTPVerifyRequest(BaseModel):
    """Request to verify an OTP code during login or signup."""
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    flow_type: Optional[str] = Field("login", description="Flow type: 'login' or 'signup'")
    account_holder_name: Optional[str] = None


class OTPResendRequest(BaseModel):
    """Request to resend OTP with cooldown."""
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")
    account_holder_name: Optional[str] = None


class CheckEmailRequest(BaseModel):
    """Request to check if an email already exists in a given bank."""
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")


class CheckEmailResponse(BaseModel):
    """Response for email existence check."""
    success: bool
    exists: bool
    message: str


class AuthResponse(BaseModel):
    """Auth response body."""
    success: bool
    message: str
    requires_otp: Optional[bool] = False
    access_token: Optional[str] = None
    bank_user_id: Optional[int] = None
    bank_id: Optional[str] = None
    account_holder_name: Optional[str] = None
    email: Optional[str] = None
    balance: Optional[int] = None
    status: Optional[str] = "active"


class PasswordResetRequest(BaseModel):
    """Request to initiate password reset via OTP."""
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID: cpb, eb, or sb")

    @validator("email")
    def validate_email(cls, v):
        email_clean = v.strip().lower()
        if "@" not in email_clean or "." not in email_clean:
            raise ValueError("Invalid email format")
        return email_clean


class PasswordResetConfirm(BaseModel):
    """Request to confirm password reset with OTP code and new password."""
    email: str = Field(..., description="User email address")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID: cpb, eb, or sb")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    new_password: str = Field(..., min_length=6, description="New user password (minimum 6 characters)")

    @validator("email")
    def validate_email(cls, v):
        email_clean = v.strip().lower()
        if "@" not in email_clean or "." not in email_clean:
            raise ValueError("Invalid email format")
        return email_clean


class ChangePasswordRequest(BaseModel):
    """Request to change password for logged-in user."""
    old_password: str = Field(..., min_length=1, description="Current password")
    new_password: str = Field(..., min_length=6, description="New password (minimum 6 characters)")


class AccountDeleteRequest(BaseModel):
    """Request to mark an account as on-hold for deletion."""
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")
    bank_user_id: int = Field(..., gt=0, description="Bank User ID")


class AccountStatusResponse(BaseModel):
    """Response showing account status and deletion details."""
    success: bool
    status: str = "active"
    deletion_requested_at: Optional[str] = None
    deletion_scheduled_for: Optional[str] = None
    message: str


# Legacy Auth Schemas for backwards compatibility
class AuthLoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")


class AuthSignupRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    account_holder_name: str = Field(..., min_length=1, description="Full name")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Bank ID")


class AuthDeviceRequest(BaseModel):
    device_fingerprint: str = Field(..., description="Unique device identifier")
    token: str = Field(..., description="Session token to verify")


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
    email: Optional[str] = None
    balance: Optional[int] = None
    bank_user_id: Optional[int] = None
    status: Optional[str] = "active"
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
# ACPI & Bank Transfer Schemas
# ============================================

class BankTransferRequest(BaseModel):
    """Request payload sent to /bank/request to execute bank-level amount change & transaction recording."""
    sender_name: str = Field(..., min_length=1, description="Sender account holder name")
    sender_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Sender bank ID")
    sender_bank_user_id: int = Field(..., gt=0, description="Sender bank user ID")
    amount: int = Field(..., gt=0, description="Amount to transfer")
    receiver_name: Optional[str] = Field(None, description="Receiver account holder name")
    receiver_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$", description="Receiver bank ID")
    receiver_bank_user_id: int = Field(..., gt=0, description="Receiver bank user ID")


class BankTransferResponse(BaseModel):
    """Response returned by /bank/request containing transaction confirmation."""
    success: bool
    transaction_id: Optional[UUID] = None
    status: str = "success"
    message: str
    sender_new_balance: Optional[int] = None
    receiver_new_balance: Optional[int] = None


class ACPITransferRequest(BaseModel):
    """Request to ACPI to execute a transfer."""
    sender_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    sender_bank_user_id: int = Field(..., gt=0)
    receiver_bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    receiver_bank_user_id: int = Field(..., gt=0)
    amount: int = Field(..., gt=0)
    sender_name: Optional[str] = None
    receiver_name: Optional[str] = None


class ACPITransferResponse(BaseModel):
    """Response from ACPI after transfer."""
    success: bool
    transaction_id: Optional[UUID] = None
    message: str
    status: Optional[str] = "success"
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


class FaucetQRGenerateRequest(BaseModel):
    """Request to generate a claimable Faucet QR code."""
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    bank_user_id: int = Field(..., gt=0)
    amount: int = Field(..., gt=0, le=500, description="Amount up to $500")


class FaucetQRResponse(BaseModel):
    """Response for Faucet QR generation."""
    success: bool
    token: Optional[str] = None
    amount: Optional[int] = None
    qr_image_base64: Optional[str] = None
    expires_at: Optional[str] = None
    message: Optional[str] = None


class FaucetClaimRequest(BaseModel):
    """Request to claim funds via scanned Faucet QR token."""
    token: str = Field(..., min_length=1, description="Faucet QR claim token")
    bank_id: str = Field(..., pattern="^(?i)(cpb|eb|sb)$")
    bank_user_id: int = Field(..., gt=0)


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
