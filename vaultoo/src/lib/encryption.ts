// ============================================================
// Vaultoo - AES-256 Encryption Utilities
// ============================================================
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "vaultoo-default-key-change-in-production-32ch";

export interface EncryptedData {
  ciphertext: string;
  iv: string;
}

/**
 * Encrypt plaintext using AES-256-CBC
 */
export function encrypt(plaintext: string): EncryptedData {
  const iv = CryptoJS.lib.WordArray.random(16);
  const key = CryptoJS.enc.Utf8.parse(
    ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32),
  );

  const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return {
    ciphertext: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    iv: iv.toString(CryptoJS.enc.Base64),
  };
}

/**
 * Decrypt AES-256-CBC encrypted data
 */
export function decrypt(encryptedData: EncryptedData): string {
  const key = CryptoJS.enc.Utf8.parse(
    ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32),
  );
  const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(encryptedData.ciphertext),
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}
