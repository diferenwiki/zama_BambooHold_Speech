/**
 * FHEVM Decryption Signature Management
 * Manages per-account decryption signatures with localStorage persistence
 */

const SIGNATURE_CACHE_PREFIX = "fhevm.decryptionSignature";

export class FhevmDecryptionSignature {
  /**
   * Get cached signature for account
   */
  static get(account: string): string | null {
    if (!account) return null;
    
    const key = `${SIGNATURE_CACHE_PREFIX}.${account.toLowerCase()}`;
    return localStorage.getItem(key);
  }

  /**
   * Set signature for account
   */
  static set(account: string, signature: string): void {
    if (!account || !signature) return;
    
    const key = `${SIGNATURE_CACHE_PREFIX}.${account.toLowerCase()}`;
    localStorage.setItem(key, signature);
  }

  /**
   * Clear signature for specific account
   */
  static clear(account: string): void {
    if (!account) return;
    
    const key = `${SIGNATURE_CACHE_PREFIX}.${account.toLowerCase()}`;
    localStorage.removeItem(key);
  }

  /**
   * Clear all decryption signatures
   */
  static clearAll(): void {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SIGNATURE_CACHE_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
  }
}

