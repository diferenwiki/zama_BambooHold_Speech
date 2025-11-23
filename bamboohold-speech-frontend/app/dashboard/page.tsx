"use client";

/**
 * Dashboard Page - Main functionality
 */

import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { ErrorNotDeployed } from "../../components/ErrorNotDeployed";
import { useMetaMaskProvider } from "../../hooks/metamask/useMetaMaskProvider";
import { useBambooHoldSpeech } from "../../hooks/useBambooHoldSpeech";
import { useFhevm } from "../../fhevm/useFhevm";

export default function DashboardPage() {
  const { isConnected, account, chainId, provider } = useMetaMaskProvider();
  const { isDeployed, submitMetrics, getCurrentStatus, getSummary, txStatus, txError } = useBambooHoldSpeech(
    provider,
    account,
    chainId
  );
  const { isInitialized: isFhevmInitialized } = useFhevm();

  const [metrics, setMetrics] = useState({
    emotional: 50,
    social: 50,
    sleep: 50,
  });

  const [status, setStatus] = useState<{ riskScore: number; cautionWindow: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasData, setHasData] = useState(false);

  // Try to load existing data on mount (only if user has submitted before)
  useEffect(() => {
    const tryLoadExistingData = async () => {
      if (!isConnected || !isDeployed) return;
      
      try {
        // First check if user has any submissions (doesn't revert)
        const summary = await getSummary();
        
        if (summary.totalSubmissions > 0) {
          // User has data, now we can safely fetch and decrypt
          setHasData(true);
          // Don't auto-decrypt on load, let user click button
        } else {
          setHasData(false);
        }
      } catch (error: any) {
        // Silently handle - user probably hasn't submitted yet
        setHasData(false);
      }
    };

    tryLoadExistingData();
  }, [isConnected, isDeployed, getSummary]);

  const handleSubmit = async () => {
    if (!isConnected || !isFhevmInitialized) return;

    setIsLoading(true);
    try {
      await submitMetrics(metrics);
      setHasData(true);
      // Don't auto-decrypt - let user decide when to decrypt for privacy
      // User can click "Decrypt & View Status" button manually
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStatus = async () => {
    if (!isConnected) return;

    setIsRefreshing(true);
    try {
      const currentStatus = await getCurrentStatus();
      setStatus(currentStatus);
      setHasData(true);
    } catch (error: any) {
      console.error("Error refreshing status:", error);
      // Show user-friendly error
      if (error?.message?.includes("No metrics submitted")) {
        setHasData(false);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCautionLevel = () => {
    if (!status) return "unknown";
    if (status.cautionWindow === 0) return "safe";
    if (status.cautionWindow === 1) return "moderate";
    return "high";
  };

  const cautionLevel = getCautionLevel();

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="card max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-[var(--color-text-secondary)]">
              Please connect your wallet to use BambooHold Speech
            </p>
          </div>
        ) : !isDeployed ? (
          <ErrorNotDeployed chainId={chainId} />
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Caution Window Indicator */}
            <div className={`card mb-8 text-center ${
              cautionLevel === "safe" ? "border-green-300 dark:border-green-700" :
              cautionLevel === "moderate" ? "border-yellow-300 dark:border-yellow-700" :
              cautionLevel === "high" ? "border-red-300 dark:border-red-700" : ""
            }`}>
              <div className="text-6xl mb-4">
                {cautionLevel === "safe" ? "🟢" : cautionLevel === "moderate" ? "🟡" : cautionLevel === "high" ? "🔴" : "⚪"}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {cautionLevel === "safe" ? "Safe to Speak" : cautionLevel === "moderate" ? "Moderate Caution" : cautionLevel === "high" ? "High Risk - Hold Your Speech!" : "No Data Yet"}
              </h1>
              {status && (
                <div className="text-[var(--color-text-secondary)]">
                  <p className="text-lg">
                    Risk Score: {Math.round(status.riskScore / 10)}/370
                  </p>
                  <p className="text-sm mt-1">
                    ({Math.round((status.riskScore / 3700) * 100)}% of maximum risk)
                  </p>
                </div>
              )}
              {!status && hasData && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                  👇 Click &quot;Refresh Status&quot; below to decrypt and view your caution window
                </p>
              )}
              {!status && !hasData && (
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                  Submit your metrics below to get started
                </p>
              )}
            </div>

            {/* Metrics Input */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="card">
                <h2 className="text-2xl font-bold mb-6">Submit Metrics</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Emotional Fluctuation (0-100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={metrics.emotional}
                      onChange={(e) => setMetrics({ ...metrics, emotional: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-[var(--color-text-secondary)] mt-1">
                      <span>Value: {metrics.emotional}</span>
                      <span>How intense are your emotional swings today?</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Social Fatigue (0-100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={metrics.social}
                      onChange={(e) => setMetrics({ ...metrics, social: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-[var(--color-text-secondary)] mt-1">
                      <span>Value: {metrics.social}</span>
                      <span>How exhausted from social interactions?</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sleep Debt (0-100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={metrics.sleep}
                      onChange={(e) => setMetrics({ ...metrics, sleep: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-[var(--color-text-secondary)] mt-1">
                      <span>Value: {metrics.sleep}</span>
                      <span>How much sleep have you missed?</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !isFhevmInitialized}
                    className="w-full btn-primary"
                  >
                    {isLoading ? "Encrypting & Submitting..." : "Submit Encrypted Metrics"}
                  </button>

                  <button
                    onClick={refreshStatus}
                    disabled={isRefreshing || !hasData}
                    className={`w-full ${hasData && !status ? "btn-primary animate-pulse" : "btn-secondary"}`}
                    title={!hasData ? "Submit metrics first" : ""}
                  >
                    {isRefreshing ? "Decrypting..." : hasData && !status ? "🔓 Decrypt & View Status" : "Refresh Status"}
                  </button>
                </div>

                {txStatus === "success" && (
                  <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm">
                    <div>✓ Metrics submitted successfully!</div>
                    {!status && (
                      <div className="mt-2 font-semibold">
                        👆 Click &quot;Decrypt &amp; View Status&quot; above to see your caution window
                      </div>
                    )}
                  </div>
                )}

                {txStatus === "error" && txError && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg text-sm">
                    ✗ {txError}
                  </div>
                )}
              </div>

              <div className="card">
                <h2 className="text-2xl font-bold mb-6">About Your Metrics</h2>
                <div className="space-y-4 text-[var(--color-text-secondary)]">
                  <p>
                    <strong className="text-[var(--color-text-primary)]">Emotional Fluctuation (×1.2):</strong> Measures the intensity of your emotional changes throughout the day.
                  </p>
                  <p>
                    <strong className="text-[var(--color-text-primary)]">Social Fatigue (×1.0):</strong> Indicates how drained you feel from social interactions.
                  </p>
                  <p>
                    <strong className="text-[var(--color-text-primary)]">Sleep Debt (×1.5):</strong> Represents how much sleep you&apos;ve missed recently. (Highest weight!)
                  </p>
                  
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-semibold mb-2">Risk Thresholds:</p>
                    <ul className="text-sm space-y-1">
                      <li>🟢 <strong>Safe</strong>: Score &lt; 111 (&lt;30% of max)</li>
                      <li>🟡 <strong>Moderate</strong>: 111 ≤ Score &lt; 185 (30-50%)</li>
                      <li>🔴 <strong>High Risk</strong>: Score ≥ 185 (≥50%, Hold your speech!)</li>
                    </ul>
                  </div>
                  
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm">
                      🔒 <strong>Your Privacy Matters:</strong> All metrics are encrypted on your device before being sent to the blockchain. Only you can decrypt and view your data.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

