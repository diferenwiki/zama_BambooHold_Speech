"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMetaMaskProvider } from "../hooks/metamask/useMetaMaskProvider";

export function Navbar() {
  const pathname = usePathname();
  const { isConnected, account, chainId, connect, disconnect, providers } = useMetaMaskProvider();

  const isActive = (path: string) => pathname === path;

  const handleConnect = async () => {
    if (providers.length > 0) {
      await connect(providers[0]);
    }
  };

  return (
    <nav className="bg-[var(--color-surface)] border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BambooHold Speech
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/dashboard"
              className={`font-medium transition-colors ${
                isActive("/dashboard") ? "text-primary" : "text-[var(--color-text-secondary)] hover:text-primary"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/history"
              className={`font-medium transition-colors ${
                isActive("/history") ? "text-primary" : "text-[var(--color-text-secondary)] hover:text-primary"
              }`}
            >
              History
            </Link>
            <Link
              href="/summary"
              className={`font-medium transition-colors ${
                isActive("/summary") ? "text-primary" : "text-[var(--color-text-secondary)] hover:text-primary"
              }`}
            >
              Summary
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {chainId && (
              <div className="hidden sm:block px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">
                {chainId === 31337 ? "Localhost" : chainId === 11155111 ? "Sepolia" : "Unknown"}
              </div>
            )}
            
            {isConnected && account ? (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-mono">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

