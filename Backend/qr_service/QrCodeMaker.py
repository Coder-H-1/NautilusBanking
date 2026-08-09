"""
NAUTILUS Banking System — QR Code Generator
Generates scannable QR codes containing encrypted payment link/request data.
Includes 2-minute expiration TTL and base64 rendering.
"""

import io
import time
import base64
import json
from typing import Dict, Any, Optional, Tuple
import qrcode
from encryption.encrypt import encrypt as encrypt_data, decrypt as decrypt_data


# In-memory store for generated QR tokens with expiration
QR_STORE: Dict[str, Dict[str, Any]] = {}
EXPIRATION_SECONDS = 120  # 2 minutes
QR_BASE_URL = "https://nautilusbanking.vercel.app/qr/scan?data="

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

    def _generate_qr_base64(self, payload: str) -> str:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(payload)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_base64}"

    def create_share_qr(self, account_holder_name: str) -> Dict[str, Any]:
        """Type 1: Share Account Information"""
        self._cleanup_expired()
        
        payload_dict = {
            "type": "share",
            "bank_id": self.bank_id,
            "bank_user_id": self.bank_user_id,
            "account_holder_name": account_holder_name,
            "timestamp": int(time.time())
        }
        raw_payload = json.dumps(payload_dict)
        encrypted_payload = encrypt_data(raw_payload)
        full_url = f"{QR_BASE_URL}{encrypted_payload}"
        
        expires_at_epoch = time.time() + EXPIRATION_SECONDS
        img_base64 = self._generate_qr_base64(full_url)
        
        return {
            "success": True,
            "qr_image_base64": img_base64,
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at_epoch)),
        }

    def create_transfer_qr(self, account_holder_name: str, amount: Optional[int] = None) -> Dict[str, Any]:
        """Type 2: Transfer (receive) amount"""
        self._cleanup_expired()
        
        payload_dict = {
            "type": "transfer",
            "bank_id": self.bank_id,
            "bank_user_id": self.bank_user_id,
            "account_holder_name": account_holder_name,
            "timestamp": int(time.time())
        }
        if amount is not None:
            payload_dict["amount"] = amount
            
        raw_payload = json.dumps(payload_dict)
        encrypted_payload = encrypt_data(raw_payload)
        full_url = f"{QR_BASE_URL}{encrypted_payload}"
        
        expires_at_epoch = time.time() + EXPIRATION_SECONDS
        img_base64 = self._generate_qr_base64(full_url)
        
        return {
            "success": True,
            "qr_image_base64": img_base64,
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at_epoch)),
        }

    def create_faucet_qr(self, account_holder_name: str, amount: int) -> Dict[str, Any]:
        """Type 3: Transfer (send) amount (Faucet page)"""
        self._cleanup_expired()

        payload_dict = {
            "type": "faucet",
            "bank_id": self.bank_id,
            "bank_user_id": self.bank_user_id,
            "account_holder_name": account_holder_name,
            "amount": amount,
            "timestamp": int(time.time())
        }
        raw_payload = json.dumps(payload_dict)
        encrypted_payload = encrypt_data(raw_payload)
        full_url = f"{QR_BASE_URL}{encrypted_payload}"
        
        expires_at_epoch = time.time() + EXPIRATION_SECONDS
        img_base64 = self._generate_qr_base64(full_url)

        faucet_token = f"faucet_{self.bank_id}_{self.bank_user_id}_{int(time.time())}"
        QR_STORE[faucet_token] = {
            "bank_id": self.bank_id,
            "bank_user_id": self.bank_user_id,
            "amount": amount,
            "payload": encrypted_payload,
            "expires_at_epoch": expires_at_epoch,
            "claimed": False,
        }

        return {
            "success": True,
            "token": faucet_token,
            "amount": amount,
            "qr_image_base64": img_base64,
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(expires_at_epoch)),
        }

    @staticmethod
    def claim_faucet_qr(token: str, bank_id: str, bank_user_id: int) -> Tuple[bool, int, str]:
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
        
    @staticmethod
    def decode_qr(encrypted_payload: str) -> Dict[str, Any]:
        """Decodes and validates a QR payload."""
        try:
            raw_payload = decrypt_data(encrypted_payload)
            data = json.loads(raw_payload)
            
            # Basic validation
            if "type" not in data or "bank_id" not in data or "bank_user_id" not in data:
                return {"valid": False, "message": "Invalid QR code format."}
                
            # Check expiration (2 minutes = 120 seconds)
            timestamp = data.get("timestamp", 0)
            if time.time() - timestamp > EXPIRATION_SECONDS:
                return {"valid": False, "message": "QR code has expired."}
                
            data["valid"] = True
            return data
            
        except Exception as e:
            return {"valid": False, "message": f"Failed to decode QR code: {str(e)}"}
