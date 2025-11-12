"use client";

/**
 * Ethers Signer Hook
 * Provides an ethers.js signer from the wallet provider
 */

import { useMemo } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";

export function useMetaMaskEthersSigner(provider: any, account: string | null) {
  const signer = useMemo(() => {
    if (!provider || !account) {
      return null;
    }

    try {
      const ethersProvider = new BrowserProvider(provider);
      // Note: getSigner is async in ethers v6, but we cache the provider here
      // Actual signer will be retrieved when needed
      return ethersProvider;
    } catch (error) {
      console.error("Error creating ethers provider:", error);
      return null;
    }
  }, [provider, account]);

  /**
   * Get the actual signer (async)
   */
  const getSigner = async (): Promise<JsonRpcSigner | null> => {
    if (!signer) return null;
    
    try {
      return await signer.getSigner();
    } catch (error) {
      console.error("Error getting signer:", error);
      return null;
    }
  };

  return {
    ethersProvider: signer,
    getSigner,
  };
}

