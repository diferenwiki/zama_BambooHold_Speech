/**
 * FHEVM Instance Management
 * Creates and manages FHEVM instances for encryption/decryption
 */

import { loadRelayerSDK } from "./RelayerSDKLoader";
import { createMockInstance } from "./mock/fhevmMock";
import { PublicKeyStorage } from "./PublicKeyStorage";
import type { FhevmInstance } from "./fhevmTypes";

/**
 * Check if provider is a Hardhat node with FHEVM metadata
 */
async function checkHardhatFhevmMetadata(provider: any): Promise<boolean> {
  try {
    // Try to get web3_clientVersion
    const version = await provider.request({ method: "web3_clientVersion" });
    console.log("web3_clientVersion:", version);
    
    if (typeof version === "string" && version.toLowerCase().includes("hardhat")) {
      // Try to get fhevm_relayer_metadata
      try {
        const metadata = await provider.request({ method: "fhevm_relayer_metadata" });
        console.log("fhevm_relayer_metadata found:", !!metadata);
        return !!metadata;
      } catch (e) {
        console.log("fhevm_relayer_metadata not available:", e);
        return false;
      }
    }
  } catch (error) {
    console.warn("Error checking for Hardhat FHEVM node:", error);
  }
  return false;
}

/**
 * Create FHEVM instance based on network
 */
export async function createFhevmInstance(
  chainId: number,
  provider: any,
  contractAddress?: string
): Promise<FhevmInstance> {
  console.log(`Creating FHEVM instance for chain ${chainId}`);

  // For localhost (chainId 31337), always use Mock Utils
  if (chainId === 31337) {
    // Check if it's a proper Hardhat FHEVM node
    const hasMetadata = await checkHardhatFhevmMetadata(provider);
    console.log("Hardhat FHEVM metadata check result:", hasMetadata);
    
    if (hasMetadata) {
      console.log("Using Mock Utils for local development");
      return await createMockInstance();
    } else {
      // Even without metadata, use Mock Utils for localhost
      console.log("Using Mock Utils for localhost (no metadata detected, using default)");
      return await createMockInstance();
    }
  }

  // Production mode: Use Relayer SDK
  console.log("Using Relayer SDK for production");
  const relayerSDK = await loadRelayerSDK();

  if (!relayerSDK.createInstance || !relayerSDK.SepoliaConfig) {
    throw new Error("Relayer SDK not properly loaded");
  }

  // v0.9: Initialize WASM modules first
  if (relayerSDK.initWasm) {
    console.log("Initializing WASM modules...");
    try {
      await relayerSDK.initWasm({
        tfheWasmUrl: "/tfhe_bg.wasm",
        kmsWasmUrl: "/kms_lib_bg.wasm",
      });
      console.log("WASM modules initialized successfully");
    } catch (error) {
      console.warn("WASM initialization warning:", error);
      // Continue anyway, SDK might handle it internally
    }
  }

  // Use SDK's built-in network configuration
  const aclAddress = relayerSDK.SepoliaConfig.aclContractAddress;
  if (!aclAddress || typeof aclAddress !== "string") {
    throw new Error("Invalid ACL address in SepoliaConfig");
  }

  // Try to get cached public key
  const cachedPublicKey = PublicKeyStorage.get(chainId);

  const config: any = {
    ...relayerSDK.SepoliaConfig,
    network: provider,
    // v0.9: Explicit relayer URL for Sepolia
    relayerUrl: relayerSDK.SepoliaConfig.relayerUrl || "https://sepolia.relayer.zama.ai",
    gatewayUrl: relayerSDK.SepoliaConfig.gatewayUrl || "https://sepolia.gateway.zama.ai",
  };

  if (cachedPublicKey) {
    console.log("Using cached public key");
    config.publicKey = cachedPublicKey;
  }

  console.log("Creating FHEVM instance with config:", { 
    ...config, 
    network: "MetaMask provider",
    publicKey: cachedPublicKey ? "cached" : "will fetch",
    relayerUrl: config.relayerUrl,
    gatewayUrl: config.gatewayUrl
  });

  // Create instance
  const instance = await relayerSDK.createInstance(config);

  // Cache public key
  try {
    const publicKey = await instance.getPublicKey();
    PublicKeyStorage.set(chainId, publicKey);
  } catch (error) {
    console.warn("Failed to cache public key:", error);
  }

  return instance;
}

/**
 * Get or create FHEVM public key
 */
export async function getFhevmPublicKey(
  fhevmInstance: FhevmInstance,
  chainId: number
): Promise<Uint8Array> {
  // Try to get from cache
  const cached = PublicKeyStorage.get(chainId);
  if (cached) {
    console.log("Using cached FHEVM public key");
    return cached;
  }

  // Fetch from instance
  console.log("Fetching FHEVM public key...");
  const publicKey = await fhevmInstance.getPublicKey();

  // Cache it
  PublicKeyStorage.set(chainId, publicKey);

  return publicKey;
}

