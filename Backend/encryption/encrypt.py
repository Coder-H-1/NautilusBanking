"""
NAUTILUS Banking System — Encryption Module
RSA-OAEP (2048-bit) for data encryption/decryption.
HMAC-SHA256 for request signing and integrity verification.
Keys loaded fresh each call from environment variables — never cached in module globals.
"""

import os
import base64
import hashlib
import hmac

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from dotenv import load_dotenv

load_dotenv()


# ============================================
# Key Loading Helpers (fresh per call)
# ============================================

def _load_private_key():
    """Load RSA private key from env var. Called per-use, never cached."""
    pem_str = os.getenv("PRIVATE_KEY")
    if not pem_str:
        raise RuntimeError("PRIVATE_KEY environment variable is not set.")
    # Env vars use \\n for newlines — convert to actual newlines
    pem_bytes = pem_str.replace("\\n", "\n").encode("utf-8")
    return serialization.load_pem_private_key(pem_bytes, password=None, backend=default_backend())


def _load_public_key():
    """Load RSA public key from env var. Called per-use, never cached."""
    pem_str = os.getenv("PUBLIC_KEY")
    if not pem_str:
        raise RuntimeError("PUBLIC_KEY environment variable is not set.")
    pem_bytes = pem_str.replace("\\n", "\n").encode("utf-8")
    return serialization.load_pem_public_key(pem_bytes, backend=default_backend())


def _load_hmac_secret() -> bytes:
    """Load HMAC secret from env var. Called per-use, never cached."""
    secret = os.getenv("HMAC_SECRET")
    if not secret:
        raise RuntimeError("HMAC_SECRET environment variable is not set.")
    return secret.encode("utf-8")


# ============================================
# Key Generation Utility
# ============================================

def generate_keypair() -> tuple[str, str]:
    """
    Generate a new RSA 2048-bit key pair.
    Returns (private_key_pem, public_key_pem) as strings.
    Use this to create keys, then store them in env vars.
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend(),
    )

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")

    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    return private_pem, public_pem


# ============================================
# RSA-OAEP Encryption / Decryption
# ============================================

def encrypt(plaintext: str) -> str:
    """
    Encrypt plaintext string using RSA-OAEP with the public key.
    Returns base64-encoded ciphertext.
    
    Note: RSA-OAEP with 2048-bit key can encrypt max ~190 bytes.
    For larger data, encrypt a symmetric key with RSA and use AES for the data.
    """
    public_key = _load_public_key()
    plaintext_bytes = plaintext.encode("utf-8")

    # RSA-OAEP encryption
    ciphertext = public_key.encrypt(
        plaintext_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return base64.b64encode(ciphertext).decode("utf-8")


def decrypt(ciphertext: str) -> str:
    """
    Decrypt base64-encoded ciphertext using RSA-OAEP with the private key.
    Returns plaintext string.
    """
    private_key = _load_private_key()
    ciphertext_bytes = base64.b64decode(ciphertext)

    plaintext_bytes = private_key.decrypt(
        ciphertext_bytes,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return plaintext_bytes.decode("utf-8")


# ============================================
# HMAC-SHA256 Signing / Verification
# ============================================

def sign(data: str) -> str:
    """
    Create HMAC-SHA256 signature for request integrity.
    Returns hex-encoded signature string.
    """
    secret = _load_hmac_secret()
    signature = hmac.new(secret, data.encode("utf-8"), hashlib.sha256).hexdigest()
    return signature


def verify(data: str, signature: str) -> bool:
    """
    Verify HMAC-SHA256 signature for request integrity.
    Uses constant-time comparison to prevent timing attacks.
    Returns True if signature is valid, False otherwise.
    """
    expected = sign(data)
    return hmac.compare_digest(expected, signature)