import forge from "node-forge";

/**
 * Loads the public RSA key from environment variable.
 */
export function getPublicKeyPem(): string {
  const pem = process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY;
  if (!pem) {
    throw new Error("NEXT_PUBLIC_RSA_PUBLIC_KEY is not defined in environment.");
  }
  return pem.replace(/\\n/g, "\n");
}

/**
 * Encrypts sensitive string payload using RSA-OAEP (SHA-256) with the Public Key.
 * Returns Base64 encoded ciphertext.
 */
export function encryptPayload(plaintext: string): string {
  try {
    const pem = getPublicKeyPem();
    const publicKey = forge.pki.publicKeyFromPem(pem);
    
    // RSA-OAEP with SHA-256
    const encrypted = publicKey.encrypt(plaintext, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });

    return forge.util.encode64(encrypted);
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data.");
  }
}

/**
 * Computes HMAC-SHA256 signature for outgoing API requests.
 */
export function createRequestSignature(payload: string, secret?: string): string {
  const hmacSecret = secret || process.env.NEXT_PUBLIC_HMAC_SECRET || "640308f780efe2a222c93d12639e1d9d10ed9e7fb2f27356c9cbc963990703eb";
  const hmac = forge.hmac.create();
  hmac.start("sha256", hmacSecret);
  hmac.update(payload);
  return hmac.digest().toHex();
}
