"""
NAUTILUS Banking System — QR Code Generator
Generates scannable QR codes containing encrypted payment link/request data.
Includes 2-minute expiration TTL and base64 rendering.
"""

import io
import time
import base64
from typing import Dict, Any, Optional
import qrcode
from encryption.encrypt import encrypt as encrypt_data


# In-memory store for generated QR tokens with expiration
QR_STORE: Dict[str, Dict[str, Any]] = {}
EXPIRATION_SECONDS = 120  # 2 minutes


class QRCodeMaker:
    """Creates and manages timed, encrypted QR codes."""

    def __init__(self, bank_id: str, bank_user_id: int):
        self.bank_id = bank_id.lower()
        self.bank_user_id = bank_user_id

    def _cleanup_expired(self):
        """Removes expired QR codes from in-memory cache."""
        now = time.time()
        expired_keys = [k for k, v in QR_STORE.items() if v.get("expires_at_epoch", 0) < now]
        for k in expired_keys:
            QR_STORE.pop(k, None)

    def encrypt_payload(self) -> str:
        """
        Encrypts the sensitive user data (bank_id, bank_user_id, timestamp)
        using RSA public key so raw identifiers are never exposed in plaintext.
        """
        raw_payload = f"{self.bank_id}:{self.bank_user_id}:{int(time.time())}"
        return encrypt_data(raw_payload)

    def create(self) -> Dict[str, Any]:
        """
        Creates a scannable QR code image (base64 PNG) containing the encrypted payload.
        Expires in 2 minutes.
        """
        self._cleanup_expired()

        encrypted_payload = self.encrypt_payload()
        expires_at_epoch = time.time() + EXPIRATION_SECONDS

        # Generate QR Code image
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(encrypted_payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        token_key = f"{self.bank_id}_{self.bank_user_id}"
        QR_STORE[token_key] = {
            "payload": encrypted_payload,
            "expires_at_epoch": expires_at_epoch,
            "img_base64": img_base64,
        }

        return {
            "success": True,
            "qr_image_base64": f"data:image/png;base64,{img_base64}",
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at_epoch)),
        }

    def create_faucet_qr(self, amount: int) -> Dict[str, Any]:
        """
        Creates a timed, scannable QR code for a faucet deposit request (max $500).
        """
        self._cleanup_expired()

        raw_payload = f"faucet:{self.bank_id}:{self.bank_user_id}:{amount}:{int(time.time())}"
        encrypted_payload = encrypt_data(raw_payload)
        expires_at_epoch = time.time() + EXPIRATION_SECONDS

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(encrypted_payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        faucet_token = f"faucet_{self.bank_id}_{self.bank_user_id}_{int(time.time())}"
        QR_STORE[faucet_token] = {
            "bank_id": self.bank_id,
            "bank_user_id": self.bank_user_id,
            "amount": amount,
            "payload": encrypted_payload,
            "expires_at_epoch": expires_at_epoch,
            "img_base64": img_base64,
            "claimed": False,
        }

        return {
            "success": True,
            "token": faucet_token,
            "amount": amount,
            "qr_image_base64": f"data:image/png;base64,{img_base64}",
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at_epoch)),
        }

    @staticmethod
    def claim_faucet_qr(token: str, bank_id: str, bank_user_id: int) -> tuple[bool, int, str]:
        """
        Validates and marks a faucet QR token as claimed.
        """
        now = time.time()
        record = QR_STORE.get(token)
        if not record:
            return False, 0, "Faucet QR code expired or invalid."
        if record.get("expires_at_epoch", 0) < now:
            QR_STORE.pop(token, None)
            return False, 0, "Faucet QR code has expired."
        if record.get("claimed"):
            return False, 0, "This Faucet QR code has already been claimed."
        if record.get("bank_id") != bank_id.lower() or record.get("bank_user_id") != bank_user_id:
            return False, 0, "Account credentials do not match this QR code."

        record["claimed"] = True
        amount = record.get("amount", 0)
        return True, amount, "Faucet QR code verified successfully."

    def delete(self) -> bool:
        """Deletes the active QR code for this user."""
        token_key = f"{self.bank_id}_{self.bank_user_id}"
        if token_key in QR_STORE:
            del QR_STORE[token_key]
            return True
        return False

    def update(self) -> Dict[str, Any]:
        """Replaces existing QR code with a freshly generated one with a new 2-minute TTL."""
        self.delete()
        return self.create()
