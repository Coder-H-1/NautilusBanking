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