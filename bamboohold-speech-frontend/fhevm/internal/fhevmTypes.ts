/**
 * FHEVM Type Definitions
 */

export interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInput;
  getPublicKey(): Promise<Uint8Array>;
  generateDecryptionSignature(userAddress: string): Promise<string>;
  // v0.9: userDecrypt can have either 2 or 8 parameters depending on mode
  userDecrypt(
    handleOrHandleArray: string | bigint | Array<{ handle: string; contractAddress: string }>,
    signatureOrPrivateKey: string,
    publicKey?: string,
    signature?: string,
    contractAddresses?: string[],
    userAddress?: string,
    startTimestamp?: number,
    durationDays?: number
  ): Promise<bigint | Record<string, bigint>>;
  createEIP712Domain?(chainId: number): any;
  // v0.9 Mock Utils methods
  generateKeypair?(): { publicKey: string; privateKey: string };
  createEIP712?(
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number
  ): {
    domain: any;
    types: any;
    message: any;
  };
}

export interface EncryptedInput {
  add8(value: number): EncryptedInput;
  add16(value: number): EncryptedInput;
  add32(value: number): EncryptedInput;
  add64(value: number | bigint): EncryptedInput;
  addBool(value: boolean): EncryptedInput;
  encrypt(): Promise<EncryptedData>;
}

export interface EncryptedData {
  data: string[];
  handles: string[]; // v0.9: encryption result handles
  inputProof: string;
}

export interface FhevmConfig {
  network?: {
    url: string;
    chainId: number;
  };
  contractAddress?: string;
  kmsVerifierAddress?: string;
  aclAddress?: string;
  gatewayUrl?: string;
}

