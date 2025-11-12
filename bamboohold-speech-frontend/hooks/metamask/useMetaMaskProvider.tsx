"use client";

/**
 * MetaMask Provider Hook
 * Manages wallet connection with EIP-6963, persistence, and auto-reconnect
 */

import { useState, useEffect, useCallback } from "react";
import { useEip6963 } from "./useEip6963";
import { useInMemoryStorage } from "../useInMemoryStorage";

interface WalletState {
  isConnected: boolean;
  account: string | null;
  chainId: number | null;
  provider: any;
  balance: string | null;
}

export function useMetaMaskProvider() {
  const providers = useEip6963();
  
  // Persistent storage
  const [lastConnectorId, setLastConnectorId] = useInMemoryStorage<string | null>(
    "wallet.lastConnectorId",
    null
  );
  const [lastAccounts, setLastAccounts] = useInMemoryStorage<string[]>(
    "wallet.lastAccounts",
    []
  );
  const [lastChainId, setLastChainId] = useInMemoryStorage<number | null>(
    "wallet.lastChainId",
    null
  );
  const [connected, setConnected] = useInMemoryStorage<boolean>("wallet.connected", false);

  // Runtime state
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    provider: null,
    balance: null,
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update balance for current account
   */
  const updateBalance = useCallback(async (provider: any, account: string) => {
    if (!provider || !account) return;

    try {
      const balance = await provider.request({
        method: "eth_getBalance",
        params: [account, "latest"],
      });
      
      // Convert from wei to ETH
      const balanceInEth = (parseInt(balance, 16) / 1e18).toFixed(4);
      setWalletState((prev) => ({ ...prev, balance: balanceInEth }));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  }, []);

  /**
   * Set up event listeners for provider
   */
  const setupListeners = useCallback(
    (provider: any) => {
      if (!provider || !provider.on) return;

      const handleAccountsChanged = (accounts: string[]) => {
        console.log("Accounts changed:", accounts);
        
        if (accounts.length === 0) {
          // Disconnected
          disconnect();
        } else {
          const newAccount = accounts[0];
          setWalletState((prev) => ({ ...prev, account: newAccount }));
          setLastAccounts(accounts);
          updateBalance(provider, newAccount);
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        console.log("Chain changed:", chainId);
        
        setWalletState((prev) => ({ ...prev, chainId }));
        setLastChainId(chainId);
        
        // Refresh page is recommended by MetaMask for chain changes
        // But we'll just update state for now
      };

      const handleDisconnect = () => {
        console.log("Wallet disconnected");
        disconnect();
      };

      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
      provider.on("disconnect", handleDisconnect);

      return () => {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
        provider.removeListener("disconnect", handleDisconnect);
      };
    },
    [updateBalance, setLastAccounts, setLastChainId]
  );

  /**
   * Silent reconnect on page load
   */
  useEffect(() => {
    if (!connected || !lastConnectorId || providers.length === 0) return;

    const targetProvider = providers.find((p) => p.info.rdns === lastConnectorId);
    if (!targetProvider) {
      console.log("Last connector not found");
      return;
    }

    async function silentReconnect() {
      try {
        console.log("Attempting silent reconnect...");
        
        if (!targetProvider) {
          console.log("No target provider available");
          setConnected(false);
          return;
        }
        
        const provider = targetProvider.provider;

        // Use eth_accounts (no user prompt)
        const accounts = await provider.request({ method: "eth_accounts" });
        
        if (accounts.length === 0 || accounts[0] !== lastAccounts[0]) {
          console.log("Accounts don't match, clearing connection state");
          setConnected(false);
          return;
        }

        // Get current chain ID
        const chainIdHex = await provider.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);

        // Successfully reconnected
        setWalletState({
          isConnected: true,
          account: accounts[0],
          chainId,
          provider,
          balance: null,
        });

        setupListeners(provider);
        updateBalance(provider, accounts[0]);

        console.log("Silent reconnect successful");
      } catch (error: any) {
        console.error("Silent reconnect failed:", error);
        setConnected(false);
      }
    }

    silentReconnect();
  }, [providers, connected, lastConnectorId, lastAccounts, setupListeners, updateBalance, setConnected]);

  /**
   * Connect to wallet (with user prompt)
   */
  const connect = useCallback(
    async (providerDetail?: any) => {
      setIsConnecting(true);
      setError(null);

      try {
        // Use first available provider if not specified
        const targetProvider = providerDetail || providers[0];
        if (!targetProvider) {
          throw new Error("No wallet provider found");
        }

        const provider = targetProvider.provider;

        // Request accounts (user prompt)
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        if (accounts.length === 0) {
          throw new Error("No accounts returned");
        }

        // Get chain ID
        const chainIdHex = await provider.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);

        // Save to persistent storage
        setLastConnectorId(targetProvider.info.rdns);
        setLastAccounts(accounts);
        setLastChainId(chainId);
        setConnected(true);

        // Update state
        setWalletState({
          isConnected: true,
          account: accounts[0],
          chainId,
          provider,
          balance: null,
        });

        // Setup listeners
        setupListeners(provider);

        // Fetch balance
        updateBalance(provider, accounts[0]);

        console.log("Wallet connected:", accounts[0]);
      } catch (error: any) {
        console.error("Connection failed:", error);
        setError(error.message || "Failed to connect wallet");
        setConnected(false);
      } finally {
        setIsConnecting(false);
      }
    },
    [providers, setLastConnectorId, setLastAccounts, setLastChainId, setConnected, setupListeners, updateBalance]
  );

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      account: null,
      chainId: null,
      provider: null,
      balance: null,
    });

    setLastConnectorId(null);
    setLastAccounts([]);
    setLastChainId(null);
    setConnected(false);

    console.log("Wallet disconnected");
  }, [setLastConnectorId, setLastAccounts, setLastChainId, setConnected]);

  /**
   * Switch to a different network
   */
  const switchNetwork = useCallback(
    async (targetChainId: number) => {
      if (!walletState.provider) {
        throw new Error("No provider available");
      }

      try {
        await walletState.provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${targetChainId.toString(16)}` }],
        });
      } catch (error: any) {
        // Chain doesn't exist in wallet
        if (error.code === 4902) {
          throw new Error("This network is not added to your wallet");
        }
        throw error;
      }
    },
    [walletState.provider]
  );

  return {
    ...walletState,
    providers,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
}

