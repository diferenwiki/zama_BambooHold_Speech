"use client";

/**
 * EIP-6963 Wallet Discovery Hook
 * Discovers all compatible wallets in the browser
 */

import { useState, useEffect } from "react";
import type { EIP6963ProviderDetail } from "./Eip6963Types";

export function useEip6963() {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const discoveredProviders = new Map<string, EIP6963ProviderDetail>();

    function onAnnouncement(event: any) {
      const detail = event.detail as EIP6963ProviderDetail;
      
      if (detail && detail.info && detail.provider) {
        discoveredProviders.set(detail.info.uuid, detail);
        setProviders(Array.from(discoveredProviders.values()));
      }
    }

    // Listen for provider announcements
    window.addEventListener("eip6963:announceProvider", onAnnouncement);

    // Request providers to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnouncement);
    };
  }, []);

  return providers;
}

