"use client";

/**
 * Summary Page - Statistics and insights
 */

import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { ErrorNotDeployed } from "../../components/ErrorNotDeployed";
import { useMetaMaskProvider } from "../../hooks/metamask/useMetaMaskProvider";
import { useBambooHoldSpeech } from "../../hooks/useBambooHoldSpeech";
import { useFhevm } from "../../fhevm/useFhevm";

export default function SummaryPage() {
  const { isConnected, account, chainId, provider } = useMetaMaskProvider();
  const { isDeployed, getSummary, getHistoryCount, getMetricsAtIndex, decryptRecord } =
    useBambooHoldSpeech(provider, account, chainId);
  const { isInitialized: isFhevmInitialized } = useFhevm();

  const [summary, setSummary] = useState<{ totalSubmissions: number; lastTimestamp: number } | null>(null);
  const [distribution, setDistribution] = useState<{ safe: number; moderate: number; high: number }>({
    safe: 0,
    moderate: 0,
    high: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Wait for FHEVM to initialize before loading summary
    if (isConnected && isDeployed && isFhevmInitialized) {
      loadSummary();
    }
  }, [isConnected, isDeployed, isFhevmInitialized]);

  const loadSummary = async () => {
    setIsLoading(true);
    try {
      const summaryData = await getSummary();
      setSummary(summaryData);

      // Calculate distribution from recent records
      const count = await getHistoryCount();
      const maxRecords = Math.min(count, 10); // Last 10 records
      
      let safeCount = 0;
      let moderateCount = 0;
      let highCount = 0;

      for (let i = 0; i < maxRecords; i++) {
        try {
          const record = await getMetricsAtIndex(i);
          const decrypted = await decryptRecord(record);
          
          if (decrypted.cautionWindow === 0) safeCount++;
          else if (decrypted.cautionWindow === 1) moderateCount++;
          else highCount++;
        } catch (error) {
          console.error("Error processing record:", error);
        }
      }

      setDistribution({ safe: safeCount, moderate: moderateCount, high: highCount });
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="card max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-[var(--color-text-secondary)]">
              Please connect your wallet to view your summary
            </p>
          </div>
        ) : !isDeployed ? (
          <ErrorNotDeployed chainId={chainId} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Summary & Insights</h1>
              <p className="text-[var(--color-text-secondary)]">
                Overview of your emotional health patterns
              </p>
            </div>

            {!isFhevmInitialized ? (
              <div className="card text-center">
                <p className="text-[var(--color-text-secondary)]">
                  🔐 Initializing FHEVM instance...
                </p>
              </div>
            ) : isLoading ? (
              <div className="card text-center">
                <p className="text-[var(--color-text-secondary)]">
                  📊 Loading and decrypting summary data...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="card text-center">
                    <div className="text-4xl mb-2">📊</div>
                    <div className="text-3xl font-bold mb-1">{summary?.totalSubmissions || 0}</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">Total Submissions</div>
                  </div>

                  <div className="card text-center">
                    <div className="text-4xl mb-2">🕐</div>
                    <div className="text-sm mb-1">Last Update</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {formatDate(summary?.lastTimestamp || 0)}
                    </div>
                  </div>

                  <div className="card text-center">
                    <div className="text-4xl mb-2">📈</div>
                    <div className="text-sm mb-1">Recent Records</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      Last {distribution.safe + distribution.moderate + distribution.high} analyzed
                    </div>
                  </div>
                </div>

                {/* Risk Level Distribution */}
                <div className="card">
                  <h2 className="text-2xl font-bold mb-4">Risk Level Distribution</h2>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    Based on your recent submissions
                  </p>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-green-600">🟢 Safe</span>
                        <span>{distribution.safe}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-green-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${(distribution.safe / Math.max(1, distribution.safe + distribution.moderate + distribution.high)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-yellow-600">🟡 Moderate</span>
                        <span>{distribution.moderate}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${(distribution.moderate / Math.max(1, distribution.safe + distribution.moderate + distribution.high)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-red-600">🔴 High Risk</span>
                        <span>{distribution.high}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-red-500 h-3 rounded-full transition-all"
                          style={{
                            width: `${(distribution.high / Math.max(1, distribution.safe + distribution.moderate + distribution.high)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div className="card">
                  <h2 className="text-2xl font-bold mb-4">Improvement Suggestions</h2>
                  <div className="space-y-4">
                    {distribution.high > distribution.safe && (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm">
                          💡 <strong>High risk frequency detected.</strong> Consider taking breaks from
                          social media and stressful conversations when your metrics are elevated.
                        </p>
                      </div>
                    )}
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm">
                        😴 <strong>Sleep is crucial.</strong> Aim for 7-8 hours of quality sleep to reduce
                        emotional volatility and improve decision-making.
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-sm">
                        🧘 <strong>Practice mindfulness.</strong> Regular meditation or breathing exercises
                        can help manage emotional fluctuations and social fatigue.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Privacy Notice */}
                <div className="card bg-purple-50 dark:bg-purple-900/20">
                  <h3 className="font-semibold mb-2">🔒 Your Privacy</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    All sensitive metrics are encrypted and only decryptable by you. Summary statistics
                    are calculated locally in your browser. No plaintext data leaves your device.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

