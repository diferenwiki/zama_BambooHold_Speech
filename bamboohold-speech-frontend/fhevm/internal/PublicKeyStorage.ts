/**
 * Public Key Storage
 * Caches FHEVM public keys by chain ID
 */

const PUBLIC_KEY_CACHE_PREFIX = "fhevm.publicKey";

export class PublicKeyStorage {
  static set(chainId: number, publicKey: Uint8Array): void {
    const key = `${PUBLIC_KEY_CACHE_PREFIX}.${chainId}`;
    // Convert Uint8Array to base64 using browser API
    const base64Key = btoa(String.fromCharCode(...Array.from(publicKey)));
    localStorage.setItem(key, base64Key);
  }

  static get(chainId: number): Uint8Array | null {
    const key = `${PUBLIC_KEY_CACHE_PREFIX}.${chainId}`;
    const cached = localStorage.getItem(key);
    
    if (!cached) {
      return null;
    }

    try {
      // Convert base64 to Uint8Array using browser API
      const binaryString = atob(cached);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch {
      return null;
    }
  }

  static clear(chainId?: number): void {
    if (chainId) {
      const key = `${PUBLIC_KEY_CACHE_PREFIX}.${chainId}`;
      localStorage.removeItem(key);
    } else {
      // Clear all public keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PUBLIC_KEY_CACHE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  }
}

