"use client";

/**
 * History Page - View past submissions
 */

import { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { ErrorNotDeployed } from "../../components/ErrorNotDeployed";
import { useMetaMaskProvider } from "../../hooks/metamask/useMetaMaskProvider";
import { useBambooHoldSpeech } from "../../hooks/useBambooHoldSpeech";

interface DecryptedRecord {
  emotional: number;
  social: number;
  sleep: number;
  riskScore: number;
  cautionWindow: number;
  timestamp: number;
  isDecrypted: boolean;
}

export default function HistoryPage() {
  const { isConnected, account, chainId, provider } = useMetaMaskProvider();
  const { isDeployed, getHistoryCount, getMetricsAtIndex, decryptRecord, reauthorizeAllRecords, txStatus } = useBambooHoldSpeech(
    provider,
    account,
    chainId
  );

  const [records, setRecords] = useState<DecryptedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [decryptingIndex, setDecryptingIndex] = useState<number | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (isConnected && isDeployed) {
      loadHistory();
    }
  }, [isConnected, isDeployed]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const count = await getHistoryCount();
      const loadedRecords: DecryptedRecord[] = [];

      for (let i = 0; i < count; i++) {
        const record = await getMetricsAtIndex(i);
        loadedRecords.push({
          emotional: 0,
          social: 0,
          sleep: 0,
          riskScore: 0,
          cautionWindow: 0,
          timestamp: Number(record.timestamp),
          isDecrypted: false,
        });
      }

      setRecords(loadedRecords);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrypt = async (index: number) => {
    setDecryptingIndex(index);
    try {
      const record = await getMetricsAtIndex(index);
      const decrypted = await decryptRecord(record);

      setRecords((prev) => {
        const updated = [...prev];
        updated[index] = { ...decrypted, isDecrypted: true };
        return updated;
      });
    } catch (error) {
      console.error("Error decrypting record:", error);
    } finally {
      setDecryptingIndex(null);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getCautionLabel = (level: number) => {
    if (level === 0) return { text: "Safe", color: "text-green-600" };
    if (level === 1) return { text: "Moderate", color: "text-yellow-600" };
    return { text: "High Risk", color: "text-red-600" };
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {!isConnected ? (
          <div className="card max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-[var(--color-text-secondary)]">
              Please connect your wallet to view your history
            </p>
          </div>
        ) : !isDeployed ? (
          <ErrorNotDeployed chainId={chainId} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h1 className="text-3xl font-bold mb-2">My Metrics History</h1>
                  <p className="text-[var(--color-text-secondary)]">
                    Review your past submissions (encrypted, only you can view)
                  </p>
                </div>
                {records.length > 0 && (
                  <button
                    onClick={async () => {
                      setIsFixing(true);
                      try {
                        await reauthorizeAllRecords();
                        alert("✅ All records re-authorized! You can now decrypt them.");
                      } catch (error: any) {
                        alert(`Failed to fix authorization: ${error.message}`);
                      } finally {
                        setIsFixing(false);
                      }
                    }}
                    disabled={isFixing || txStatus === "pending"}
                    className="btn-secondary"
                  >
                    {isFixing || txStatus === "pending" ? "Fixing..." : "🔧 Fix Authorization"}
                  </button>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="card text-center">
                <p>Loading history...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="card text-center">
                <div className="text-5xl mb-4">📭</div>
                <h2 className="text-2xl font-bold mb-2">No History Yet</h2>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Submit your first metrics on the Dashboard!
                </p>
                <a href="/dashboard" className="btn-primary inline-block">
                  Go to Dashboard
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record, index) => {
                  const caution = getCautionLabel(record.cautionWindow);
                  
                  return (
                    <div key={index} className="card">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-sm text-[var(--color-text-secondary)]">
                            {formatDate(record.timestamp)}
                          </div>
                          {record.isDecrypted && (
                            <div className={`font-semibold ${caution.color}`}>
                              {caution.text}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDecrypt(index)}
                          disabled={record.isDecrypted || decryptingIndex === index}
                          className="btn-secondary text-sm"
                        >
                          {decryptingIndex === index
                            ? "Decrypting..."
                            : record.isDecrypted
                            ? "Decrypted"
                            : "Decrypt"}
                        </button>
                      </div>

                      {record.isDecrypted ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-[var(--color-text-secondary)]">Emotional</div>
                            <div className="font-semibold">{record.emotional}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--color-text-secondary)]">Social</div>
                            <div className="font-semibold">{record.social}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--color-text-secondary)]">Sleep</div>
                            <div className="font-semibold">{record.sleep}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[var(--color-text-secondary)]">Risk Score</div>
                            <div className="font-semibold">{Math.round(record.riskScore / 10)}/370</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[var(--color-text-secondary)] italic">
                          [Encrypted - Click Decrypt to view]
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

