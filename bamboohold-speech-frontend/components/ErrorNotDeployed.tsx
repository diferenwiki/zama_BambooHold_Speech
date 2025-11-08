"use client";

export function ErrorNotDeployed({ chainId }: { chainId: number | null }) {
  return (
    <div className="card max-w-2xl mx-auto mt-12 border-red-200 dark:border-red-800">
      <div className="text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-2 text-red-600 dark:text-red-400">
          Contract Not Deployed
        </h2>
        <p className="text-[var(--color-text-secondary)] mb-6">
          The BambooHoldSpeech contract is not deployed on {chainId === 31337 ? "Localhost" : chainId === 11155111 ? "Sepolia" : `chain ${chainId}`}.
        </p>
        
        {chainId === 31337 ? (
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p className="font-semibold mb-2">To deploy locally:</p>
            <pre className="text-sm">
              <code>
                cd ../fhevm-hardhat-template{"\n"}
                npx hardhat node{"\n"}
                npx hardhat deploy --network localhost
              </code>
            </pre>
          </div>
        ) : (
          <div className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <p className="font-semibold mb-2">To deploy to Sepolia:</p>
            <pre className="text-sm">
              <code>
                cd ../fhevm-hardhat-template{"\n"}
                npx hardhat deploy --network sepolia
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

