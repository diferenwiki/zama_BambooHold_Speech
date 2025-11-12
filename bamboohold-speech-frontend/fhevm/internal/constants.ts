/**
 * FHEVM Network Constants
 */

export const SUPPORTED_CHAIN_IDS = [31337, 11155111] as const;

export const CHAIN_ID_TO_NETWORK_NAME = {
  31337: "Localhost",
  11155111: "Sepolia",
} as const;

export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export function isSupportedChain(chainId: number): chainId is SupportedChainId {
  return SUPPORTED_CHAIN_IDS.includes(chainId as SupportedChainId);
}

export function getNetworkName(chainId: number): string {
  return CHAIN_ID_TO_NETWORK_NAME[chainId as SupportedChainId] || "Unknown";
}

