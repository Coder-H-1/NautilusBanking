"use server";

import forge from "node-forge";

/**
 * Server Action: Decrypt ciphertext using private key stored securely in server environment.
 * The private key NEVER leaves the server and is NEVER sent to the client browser.
 */
export async function serverDecryptPayload(ciphertextB64: string): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const pem = process.env.RSA_PRIVATE_KEY;
    if (!pem) {
      return { success: false, error: "Server RSA private key is not configured." };
    }

    const cleanPem = pem.replace(/\\n/g, "\n");
    const privateKey = forge.pki.privateKeyFromPem(cleanPem);
    const decodedBytes = forge.util.decode64(ciphertextB64);

    const decrypted = privateKey.decrypt(decodedBytes, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });

    return { success: true, data: decrypted };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Decryption failed on server";
    return { success: false, error: message };
  }
}
