#!/usr/bin/env node

/**
 * Check if local Hardhat node is running on port 8545
 * Exits with error if node is not running (required for dev:mock mode)
 */

import { createConnection } from "net";

const HARDHAT_PORT = 8545;
const HARDHAT_HOST = "127.0.0.1";

function checkHardhatNode() {
  return new Promise((resolve) => {
    const socket = createConnection({ port: HARDHAT_PORT, host: HARDHAT_HOST });

    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.on("error", () => {
      resolve(false);
    });

    // Timeout after 1 second
    setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 1000);
  });
}

async function main() {
  console.log("=== Hardhat Node Check ===");
  console.log(`Checking for Hardhat node at ${HARDHAT_HOST}:${HARDHAT_PORT}...`);

  const isRunning = await checkHardhatNode();

  if (isRunning) {
    console.log("✓ Hardhat node is running");
    process.exit(0);
  } else {
    console.error("\n✗ Hardhat node is NOT running!");
    console.error("\nTo start the Hardhat node:");
    console.error("  cd ../fhevm-hardhat-template");
    console.error("  npx hardhat node");
    console.error("\nThen deploy contracts:");
    console.error("  npx hardhat deploy --network localhost");
    console.error("\nOr use 'npm run dev' for production mode (Sepolia).");
    process.exit(1);
  }
}

main();

