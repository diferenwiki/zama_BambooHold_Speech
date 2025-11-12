"use client";

/**
 * FHEVM Context and Hook
 * Provides FHEVM instance and encryption/decryption utilities
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createFhevmInstance, getFhevmPublicKey } from "./internal/fhevm";
import { FhevmDecryptionSignature } from "./FhevmDecryptionSignature";
import type { FhevmInstance } from "./internal/fhevmTypes";

interface FhevmContextValue {
  fhevmInstance: FhevmInstance | null;
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  userDecrypt: (handle: string | bigint, contractAddress: string, signer: any) => Promise<bigint>;
  userDecryptBatch: (handles: Array<string | bigint>, contractAddress: string, signer: any) => Promise<bigint[]>;
  clearSignature: (account: string) => void;
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

interface FhevmProviderProps {
  children: React.ReactNode;
  provider: any;
  account: string | null;
  chainId: number | null;
  contractAddress?: string;
}

export function FhevmProvider({
  children,
  provider,
  account,
  chainId,
  contractAddress,
}: FhevmProviderProps) {
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize FHEVM instance when provider/chainId changes
  useEffect(() => {
    if (!provider || !chainId) {
      setFhevmInstance(null);
      setIsInitialized(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function init() {
      setIsInitializing(true);
      setError(null);

      if (!chainId) {
        setError("Chain ID not available");
        setIsInitializing(false);
        return;
      }

      try {
        const instance = await createFhevmInstance(chainId, provider, contractAddress);
        
        if (!cancelled) {
          // Pre-fetch public key (skip for localhost/mock mode)
          if (chainId !== 31337) {
            await getFhevmPublicKey(instance, chainId);
          }
          
          setFhevmInstance(instance);
          setIsInitialized(true);
          console.log("FHEVM instance initialized successfully");
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Failed to initialize FHEVM:", err);
          setError(err.message || "Failed to initialize FHEVM");
          setIsInitialized(false);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [provider, chainId, contractAddress]);

  /**
   * Decrypt encrypted handle for current account
   * Always generates fresh signature (no caching)
   */
  const userDecrypt = useCallback(
    async (
      handle: string | bigint,
      contractAddress: string,
      signer: any
    ): Promise<bigint> => {
      if (!fhevmInstance) {
        throw new Error("FHEVM instance not initialized");
      }

      if (!account) {
        throw new Error("No account connected");
      }

      console.log("🔐 Generating new decryption signature (requires user signature)");
      
      // Check if generateKeypair is available (v0.9 Mock Utils)
      if (!fhevmInstance.generateKeypair) {
        throw new Error("generateKeypair not available on FHEVM instance");
      }
      
      // Generate fresh keypair every time
      const { publicKey, privateKey } = fhevmInstance.generateKeypair();
      
      // Create EIP-712 typed data with contract address in array
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365;
      const contractAddresses = [contractAddress];
      
      // Check if createEIP712 is available (v0.9 Mock Utils)
      if (!fhevmInstance.createEIP712) {
        throw new Error("createEIP712 not available on FHEVM instance");
      }
      
      const eip712 = fhevmInstance.createEIP712(
        publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );
      
      // Request user signature
      console.log("📝 Requesting signature from wallet...");
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      
      const signatureData = {
        publicKey,
        privateKey,
        signature,
        contractAddresses,
        userAddress: account,
        startTimestamp,
        durationDays,
      };
      
      console.log("🔓 Decrypting handle...");
      
      // Decrypt using full parameters (Mock Utils API)
      const result = await fhevmInstance.userDecrypt(
        [{ handle: handle.toString(), contractAddress }],
        signatureData.privateKey,
        signatureData.publicKey,
        signatureData.signature,
        signatureData.contractAddresses,
        signatureData.userAddress,
        signatureData.startTimestamp,
        signatureData.durationDays
      );
      
      // Extract the decrypted value for this handle
      const handleStr = handle.toString();
      
      // Type guard: ensure result is a Record
      if (typeof result === "bigint") {
        throw new Error("Unexpected result type: bigint");
      }
      
      const decryptedValue = result[handleStr];
      
      if (decryptedValue === undefined) {
        throw new Error("Failed to decrypt handle");
      }
      
      console.log("✅ Decryption successful");
      return BigInt(decryptedValue);
    },
    [fhevmInstance, account]
  );

  /**
   * Batch decrypt multiple handles with single signature
   * More efficient for decrypting multiple values at once
   */
  const userDecryptBatch = useCallback(
    async (
      handles: Array<string | bigint>,
      contractAddress: string,
      signer: any
    ): Promise<bigint[]> => {
      if (!fhevmInstance) {
        throw new Error("FHEVM instance not initialized");
      }

      if (!account) {
        throw new Error("No account connected");
      }

      if (handles.length === 0) {
        return [];
      }

      console.log(`🔐 Batch decrypting ${handles.length} handles with single signature`);
      
      // Validate contractAddress
      if (!contractAddress || typeof contractAddress !== "string") {
        throw new Error(`Invalid contractAddress: ${contractAddress}`);
      }
      
      // Ensure contractAddress is a valid Ethereum address format
      if (!contractAddress.startsWith("0x") || contractAddress.length !== 42) {
        throw new Error(`Invalid contractAddress format: ${contractAddress}`);
      }
      
      // Check if required methods are available (v0.9 Mock Utils)
      if (!fhevmInstance.generateKeypair || !fhevmInstance.createEIP712) {
        throw new Error("generateKeypair or createEIP712 not available on FHEVM instance");
      }
      
      // Generate fresh keypair
      const { publicKey, privateKey } = fhevmInstance.generateKeypair();
      
      // Create EIP-712 typed data
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365;
      // Ensure contractAddress is properly formatted as address array
      const contractAddresses: `0x${string}`[] = [contractAddress as `0x${string}`];
      
      console.log(`📋 Creating EIP712 with contractAddress: ${contractAddress}, addresses:`, contractAddresses);
      
      const eip712 = fhevmInstance.createEIP712(
        publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );
      
      // Request user signature (only once!)
      console.log("📝 Requesting signature from wallet...");
      const signature = await signer.signTypedData(
        eip712.domain,
        { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
        eip712.message
      );
      
      const signatureData = {
        publicKey,
        privateKey,
        signature,
        contractAddresses,
        userAddress: account,
        startTimestamp,
        durationDays,
      };
      
      console.log(`🔓 Decrypting ${handles.length} handles...`);
      
      // Prepare handles array for batch decryption
      const handleContractPairs = handles.map(handle => ({
        handle: handle.toString(),
        contractAddress
      }));
      
      // Decrypt all at once
      const result = await fhevmInstance.userDecrypt(
        handleContractPairs,
        signatureData.privateKey,
        signatureData.publicKey,
        signatureData.signature,
        signatureData.contractAddresses,
        signatureData.userAddress,
        signatureData.startTimestamp,
        signatureData.durationDays
      );
      
      // Extract decrypted values in order
      const decryptedValues: bigint[] = [];
      
      // Type guard: ensure result is a Record
      if (typeof result === "bigint") {
        throw new Error("Unexpected result type: bigint");
      }
      
      for (const handle of handles) {
        const handleStr = handle.toString();
        const decryptedValue = result[handleStr];
        
        if (decryptedValue === undefined) {
          throw new Error(`Failed to decrypt handle ${handleStr}`);
        }
        
        decryptedValues.push(BigInt(decryptedValue));
      }
      
      console.log(`✅ Batch decryption successful (${handles.length} values)`);
      return decryptedValues;
    },
    [fhevmInstance, account]
  );

  /**
   * Clear decryption signature for account
   */
  const clearSignature = useCallback((accountAddress: string, contractAddr?: string) => {
    if (contractAddr) {
      const cacheKey = `${accountAddress}:${contractAddr}`;
      FhevmDecryptionSignature.clear(cacheKey);
    } else {
      // Clear old-style cache (for backward compatibility)
      FhevmDecryptionSignature.clear(accountAddress);
      // Also try to clear common contract addresses if we don't know which one
      // This is a cleanup helper
    }
  }, []);

  const value: FhevmContextValue = {
    fhevmInstance,
    isInitialized,
    isInitializing,
    error,
    userDecrypt,
    userDecryptBatch,
    clearSignature,
  };

  return <FhevmContext.Provider value={value}>{children}</FhevmContext.Provider>;
}

/**
 * Hook to access FHEVM context
 */
export function useFhevm() {
  const context = useContext(FhevmContext);
  
  if (context === undefined) {
    throw new Error("useFhevm must be used within FhevmProvider");
  }

  return context;
}

