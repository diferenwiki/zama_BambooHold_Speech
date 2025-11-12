"use client";

/**
 * BambooHoldSpeech Contract Interaction Hook
 * Provides methods to interact with the smart contract
 */

import { useState, useCallback, useEffect } from "react";
import { Contract } from "ethers";
import { BambooHoldSpeechABI } from "../abi/BambooHoldSpeechABI";
import { getBambooHoldSpeechAddress } from "../abi/BambooHoldSpeechAddresses";
import { useFhevm } from "../fhevm/useFhevm";

interface MetricsData {
  emotional: number;
  social: number;
  sleep: number;
}

interface HistoryRecord {
  emotional: bigint;
  social: bigint;
  sleep: bigint;
  riskScore: bigint;
  cautionWindow: bigint;
  timestamp: bigint;
}

interface DecryptedRecord {
  emotional: number;
  social: number;
  sleep: number;
  riskScore: number;
  cautionWindow: number;
  timestamp: number;
}

type TxStatus = "idle" | "pending" | "success" | "error";

export function useBambooHoldSpeech(
  provider: any,
  account: string | null,
  chainId: number | null
) {
  const { fhevmInstance, userDecrypt, userDecryptBatch } = useFhevm();
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState(false);
  const [ethersProvider, setEthersProvider] = useState<any>(null);
  
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txError, setTxError] = useState<string | null>(null);

  // Initialize ethers provider
  useEffect(() => {
    if (!provider) {
      setEthersProvider(null);
      return;
    }

    const setupProvider = async () => {
      try {
        const { BrowserProvider } = await import("ethers");
        const ethProvider = new BrowserProvider(provider);
        setEthersProvider(ethProvider);
      } catch (error) {
        console.error("Error creating ethers provider:", error);
      }
    };

    setupProvider();
  }, [provider]);

  // Initialize contract
  useEffect(() => {
    if (!ethersProvider || !chainId) {
      setContract(null);
      setContractAddress(null);
      setIsDeployed(false);
      return;
    }

    const address = getBambooHoldSpeechAddress(chainId);
    if (!address) {
      console.warn(`No contract deployed on chain ${chainId}`);
      setIsDeployed(false);
      return;
    }

    try {
      const contractInstance = new Contract(address, BambooHoldSpeechABI, ethersProvider);
      setContract(contractInstance);
      setContractAddress(address);
      setIsDeployed(true);
    } catch (error) {
      console.error("Error creating contract instance:", error);
      setIsDeployed(false);
    }
  }, [ethersProvider, chainId]);

  /**
   * Submit encrypted metrics
   */
  const submitMetrics = useCallback(
    async (metrics: MetricsData) => {
      if (!contract || !account || !fhevmInstance || !contractAddress) {
        throw new Error("Contract or FHEVM not initialized");
      }

      setTxStatus("pending");
      setTxError(null);

      try {
        // Create encrypted input
        const input = fhevmInstance.createEncryptedInput(contractAddress, account);
        input.add16(metrics.emotional);
        input.add16(metrics.social);
        input.add16(metrics.sleep);

        const encryptedData = await input.encrypt();

        // Get signer
        const signer = await ethersProvider.getSigner();
        const contractWithSigner = contract.connect(signer) as any;

        // Submit transaction with handles and inputProof
        const tx = await contractWithSigner.submitMetrics(
          encryptedData.handles[0],
          encryptedData.handles[1],
          encryptedData.handles[2],
          encryptedData.inputProof
        );

        console.log("Transaction sent:", tx.hash);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt.hash);

        setTxStatus("success");
        return receipt;
      } catch (error: any) {
        console.error("Error submitting metrics:", error);
        setTxError(error.message || "Transaction failed");
        setTxStatus("error");
        throw error;
      }
    },
    [contract, account, fhevmInstance, contractAddress, ethersProvider]
  );

  /**
   * Get latest risk score (encrypted)
   */
  const getRiskScore = useCallback(async (): Promise<bigint> => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    return await contract.getRiskScore();
  }, [contract]);

  /**
   * Get caution window (encrypted)
   */
  const getCautionWindow = useCallback(async (): Promise<bigint> => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    return await contract.getCautionWindow();
  }, [contract]);

  /**
   * Get latest metrics with decryption
   */
  const getLatestMetrics = useCallback(async () => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const [emotional, social, sleep, timestamp] = await contract.getLatestMetrics();

    return {
      emotional,
      social,
      sleep,
      timestamp: Number(timestamp),
    };
  }, [contract]);

  /**
   * Decrypt and get current status (batch decryption - single signature!)
   */
  const getCurrentStatus = useCallback(async () => {
    if (!contract || !contractAddress || !ethersProvider) {
      throw new Error("Contract not initialized");
    }

    const signer = await ethersProvider.getSigner();

    const [riskScoreEncrypted, cautionWindowEncrypted] = await Promise.all([
      contract.getRiskScore(),
      contract.getCautionWindow(),
    ]);

    // Batch decrypt both fields with single signature
    const [riskScore, cautionWindow] = await userDecryptBatch(
      [riskScoreEncrypted, cautionWindowEncrypted],
      contractAddress,
      signer
    );

    return {
      riskScore: Number(riskScore),
      cautionWindow: Number(cautionWindow),
    };
  }, [contract, contractAddress, ethersProvider, userDecryptBatch]);

  /**
   * Get history count
   */
  const getHistoryCount = useCallback(async (): Promise<number> => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const count = await contract.getHistoryCount();
    return Number(count);
  }, [contract]);

  /**
   * Get metrics at specific index
   */
  const getMetricsAtIndex = useCallback(
    async (index: number): Promise<HistoryRecord> => {
      if (!contract) {
        throw new Error("Contract not initialized");
      }

      const [emotional, social, sleep, riskScore, cautionWindow, timestamp] =
        await contract.getMetricsAtIndex(index);

      return {
        emotional,
        social,
        sleep,
        riskScore,
        cautionWindow,
        timestamp,
      };
    },
    [contract]
  );

  /**
   * Decrypt history record (batch decryption - single signature!)
   */
  const decryptRecord = useCallback(
    async (record: HistoryRecord): Promise<DecryptedRecord> => {
      if (!contractAddress || !ethersProvider) {
        throw new Error("Contract not initialized");
      }

      const signer = await ethersProvider.getSigner();

      // Batch decrypt all 5 fields with single signature
      const handles = [
        record.emotional,
        record.social,
        record.sleep,
        record.riskScore,
        record.cautionWindow,
      ];

      const [emotional, social, sleep, riskScore, cautionWindow] = 
        await userDecryptBatch(handles, contractAddress, signer);

      return {
        emotional: Number(emotional),
        social: Number(social),
        sleep: Number(sleep),
        riskScore: Number(riskScore),
        cautionWindow: Number(cautionWindow),
        timestamp: Number(record.timestamp),
      };
    },
    [contractAddress, ethersProvider, userDecryptBatch]
  );

  /**
   * Get summary statistics
   */
  const getSummary = useCallback(async () => {
    if (!contract) {
      throw new Error("Contract not initialized");
    }

    const [totalSubmissions, lastTimestamp] = await contract.getSummary();

    return {
      totalSubmissions: Number(totalSubmissions),
      lastTimestamp: Number(lastTimestamp),
    };
  }, [contract]);

  /**
   * Re-authorize all records for decryption (fix for old records)
   */
  const reauthorizeAllRecords = useCallback(async () => {
    if (!contract || !ethersProvider) {
      throw new Error("Contract not initialized");
    }

    const signer = await ethersProvider.getSigner();
    const contractWithSigner = contract.connect(signer) as any;
    
    setTxStatus("pending");
    setTxError(null);

    try {
      const tx = await contractWithSigner.reauthorizeAllRecords();
      await tx.wait();
      setTxStatus("success");
      console.log("✅ All records re-authorized successfully");
    } catch (error: any) {
      console.error("Error re-authorizing records:", error);
      setTxError(error.message || "Failed to re-authorize records");
      setTxStatus("error");
      throw error;
    }
  }, [contract, ethersProvider]);

  return {
    contract,
    contractAddress,
    isDeployed,
    txStatus,
    txError,
    submitMetrics,
    getRiskScore,
    getCautionWindow,
    getLatestMetrics,
    getCurrentStatus,
    getHistoryCount,
    getMetricsAtIndex,
    decryptRecord,
    getSummary,
    reauthorizeAllRecords,
  };
}

