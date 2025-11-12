/**
 * Relayer SDK Dynamic Loader
 * Loads the Relayer SDK from CDN to avoid SSR issues
 */

// FHEVM v0.9 - Relayer SDK v0.3.0-5
const SDK_CDN_URL = "https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs";

export async function loadRelayerSDK(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("Relayer SDK can only be loaded in browser environment");
  }

  // Check if already loaded
  if ((window as any).relayerSDK) {
    return (window as any).relayerSDK;
  }

  // Load from CDN
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${SDK_CDN_URL}"]`);
    
    if (existingScript) {
      if ((window as any).relayerSDK) {
        resolve((window as any).relayerSDK);
      } else {
        reject(new Error("Relayer SDK script exists but window.relayerSDK is not available"));
      }
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_CDN_URL;
    script.type = "text/javascript";
    script.async = true;

    script.onload = () => {
      if ((window as any).relayerSDK) {
        resolve((window as any).relayerSDK);
      } else {
        reject(new Error("Relayer SDK loaded but window.relayerSDK is not available"));
      }
    };

    script.onerror = () => {
      reject(new Error(`Failed to load Relayer SDK from ${SDK_CDN_URL}`));
    };

    document.head.appendChild(script);
  });
}


