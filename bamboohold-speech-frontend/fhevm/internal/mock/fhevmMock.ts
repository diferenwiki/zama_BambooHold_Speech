/**
 * FHEVM Mock Instance Creation (v0.9)
 * For local development with Hardhat node
 */

import type { FhevmInstance } from "../fhevmTypes";

export async function createMockInstance(): Promise<FhevmInstance> {
  // WARNING: Use dynamic import to avoid including mock lib in production bundle
  const { MockFhevmInstance } = await import("@fhevm/mock-utils");
  const { JsonRpcProvider, Contract } = await import("ethers");
  
  // Connect to local Hardhat node
  const rpcUrl = "http://localhost:8545";
  const provider = new JsonRpcProvider(rpcUrl);
  
  // Try to get FHEVM metadata from Hardhat node
  let metadata;
  try {
    metadata = await provider.send("fhevm_relayer_metadata", []);
    console.log("[fhevmMock] Retrieved FHEVM metadata from Hardhat:", metadata);
  } catch (error) {
    console.warn("[fhevmMock] Could not retrieve fhevm_relayer_metadata, using defaults:", error);
    // Use default addresses for local Hardhat FHEVM
    metadata = {
      ACLAddress: "0x2Fb4341027eb1d2aD8B5D9708187df8633cAFA92",
      InputVerifierAddress: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
      KMSVerifierAddress: "0xa82fF9aFd8f496c3d6ac40E2a0F282E47488CFc9",
      CoprocessorAddress: "0xCD3ab3bd6bcc0c0bf3E27912a92043e817B1cf69",
    };
  }
  
  // FHEVM v0.9: Query InputVerifier and KMSVerifier EIP712 domains
  let verifyingContractAddressInputVerification: `0x${string}`;
  let verifyingContractAddressDecryption: `0x${string}`;
  let gatewayChainId: number;
  
  const eip712DomainABI = [
    "function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])",
  ];
  
  // Query InputVerifier EIP712 domain
  try {
    const inputVerifierContract = new Contract(
      metadata.InputVerifierAddress,
      eip712DomainABI,
      provider
    );
    const inputDomain = await inputVerifierContract.eip712Domain();
    verifyingContractAddressInputVerification = inputDomain[4]; // index 4 is verifyingContract
    const inputChainId = Number(inputDomain[3]); // index 3 is chainId
    console.log("[fhevmMock] InputVerifier EIP712 domain chainId:", inputChainId);
    console.log("[fhevmMock] InputVerifier EIP712 verifyingContract:", verifyingContractAddressInputVerification);
    
    // Use InputVerifier's chainId as gatewayChainId (they should match)
    gatewayChainId = inputChainId;
  } catch (error) {
    console.warn("[fhevmMock] Could not query InputVerifier EIP712 domain, using defaults:", error);
    verifyingContractAddressInputVerification = metadata.InputVerifierAddress;
    gatewayChainId = 55815;
  }
  
  // Query KMSVerifier EIP712 domain for decryption
  // Note: Use KMSVerifierAddress, not CoprocessorAddress
  let kmsVerifierEip712Domain: any = undefined;
  try {
    const kmsVerifierContract = new Contract(
      metadata.KMSVerifierAddress,
      eip712DomainABI,
      provider
    );
    const kmsDomain = await kmsVerifierContract.eip712Domain();
    verifyingContractAddressDecryption = kmsDomain[4]; // index 4 is verifyingContract
    const kmsChainId = Number(kmsDomain[3]); // index 3 is chainId
    console.log("[fhevmMock] KMSVerifier EIP712 domain chainId:", kmsChainId);
    console.log("[fhevmMock] KMSVerifier EIP712 verifyingContract:", verifyingContractAddressDecryption);
    
    // Store EIP712 domain for passing to MockFhevmInstance
    kmsVerifierEip712Domain = {
      fields: Number(BigInt(kmsDomain[0])),
      name: kmsDomain[1],
      version: kmsDomain[2],
      chainId: kmsDomain[3],
      verifyingContract: kmsDomain[4],
      salt: kmsDomain[5],
    };
    
    // Ensure gatewayChainId matches KMSVerifier's chainId (required for createEIP712 assertions)
    if (gatewayChainId !== kmsChainId) {
      console.warn(`[fhevmMock] gatewayChainId (${gatewayChainId}) != KMSVerifier chainId (${kmsChainId}), using KMSVerifier chainId`);
      gatewayChainId = kmsChainId;
    }
  } catch (error) {
    console.warn("[fhevmMock] Could not query KMSVerifier EIP712 domain, using KMSVerifierAddress:", error);
    // Fallback: Use KMSVerifierAddress directly (not CoprocessorAddress)
    verifyingContractAddressDecryption = metadata.KMSVerifierAddress;
    // Note: gatewayChainId should already be set from InputVerifier query
    console.log("[fhevmMock] Using KMSVerifierAddress as verifyingContractAddressDecryption:", verifyingContractAddressDecryption);
    // KMSVerifier.create will query EIP712 domain internally if not provided
  }
  
  // FHEVM v0.9: MockFhevmInstance.create now requires 4 parameters
  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: metadata.ACLAddress,
      chainId: 31337,
      gatewayChainId: gatewayChainId,
      inputVerifierContractAddress: metadata.InputVerifierAddress,
      kmsContractAddress: metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption: verifyingContractAddressDecryption,
      verifyingContractAddressInputVerification: verifyingContractAddressInputVerification,
    },
    {
      // v0.9 requires properties parameter
      inputVerifierProperties: {},
      kmsVerifierProperties: kmsVerifierEip712Domain ? {
        eip712Domain: kmsVerifierEip712Domain,
      } : {},
    }
  );
  
  console.log("[fhevmMock] ✅ Mock FHEVM instance created successfully");
  return instance as unknown as FhevmInstance;
}

