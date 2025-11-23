"use client";

/**
 * Global Providers
 * Wraps the app with necessary context providers
 */

import React from "react";
import { FhevmProvider } from "../fhevm/useFhevm";
import { useMetaMaskProvider } from "../hooks/metamask/useMetaMaskProvider";

interface ProvidersProps {
  children: React.ReactNode;
}

function ProvidersInner({ children }: ProvidersProps) {
  const { provider, account, chainId } = useMetaMaskProvider();

  return (
    <FhevmProvider provider={provider} account={account} chainId={chainId}>
      {children}
    </FhevmProvider>
  );
}

export function Providers({ children }: ProvidersProps) {
  return <ProvidersInner>{children}</ProvidersInner>;
}

