# BambooHold Speech

> Protect Your Voice, Guard Your Peace

A privacy-first caution reminder system powered by Fully Homomorphic Encryption (FHEVM). BambooHold Speech enables users to submit encrypted emotional and health metrics for on-chain computation without revealing sensitive data.

## 🌟 Features

- **Privacy by Design**: All emotional and health data encrypted end-to-end with FHEVM
- **Smart Caution Window**: Real-time risk assessment based on encrypted multi-dimensional metrics
- **Self-Improvement**: Review your patterns and improve emotional management
- **Fully Decentralized**: You own your data, no third-party access

## 🏗️ Architecture

This project consists of two main components:

1. **Smart Contracts** (`fhevm-hardhat-template/`): FHEVM-based Solidity contracts for on-chain encrypted computation
2. **Frontend** (`bamboohold-speech-frontend/`): Next.js application with wallet integration and FHEVM support

## 📋 Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7 or higher
- **MetaMask** or compatible Web3 wallet
- **Hardhat Node** (for local development with mock FHEVM)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/diferenwiki/zama_BambooHold_Speech.git
cd zama_BambooHold_Speech
```

### 2. Install Dependencies

#### Smart Contracts

```bash
cd fhevm-hardhat-template
npm install
```

#### Frontend

```bash
cd ../bamboohold-speech-frontend
npm install
```

### 3. Set Up Environment Variables

#### For Smart Contracts

```bash
cd fhevm-hardhat-template

# Set your mnemonic for deployment
npx hardhat vars set MNEMONIC

# Set Infura API key for network access
npx hardhat vars set INFURA_API_KEY

# Optional: Set Etherscan API key for contract verification
npx hardhat vars set ETHERSCAN_API_KEY
```

### 4. Compile and Test Contracts

```bash
cd fhevm-hardhat-template

# Compile contracts
npm run compile

# Run tests
npm run test
```

### 5. Deploy Contracts

#### Local Development (with Mock FHEVM)

```bash
# Start local Hardhat node with FHEVM support
npx hardhat node

# In another terminal, deploy to localhost
npx hardhat deploy --network localhost
```

#### Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat deploy --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 6. Run Frontend

#### Development Mode (Mock FHEVM)

```bash
cd bamboohold-speech-frontend

# Ensure Hardhat node is running, then:
npm run dev:mock
```

#### Development Mode (Real Relayer)

```bash
cd bamboohold-speech-frontend

# Generate ABI and start dev server
npm run dev
```

#### Production Build

```bash
cd bamboohold-speech-frontend

# Check static export compliance
npm run check:static

# Build for production
npm run build
```

## 📁 Project Structure

```
zama_BambooHold_Speech/
├── fhevm-hardhat-template/          # Smart contracts and Hardhat setup
│   ├── contracts/
│   │   ├── BambooHoldSpeech.sol    # Main FHEVM contract
│   │   └── FHECounter.sol          # Example FHE counter
│   ├── deploy/                      # Deployment scripts
│   ├── tasks/                       # Hardhat custom tasks
│   ├── test/                        # Contract tests
│   └── hardhat.config.ts           # Hardhat configuration
│
├── bamboohold-speech-frontend/      # Next.js frontend application
│   ├── app/                         # Next.js app directory
│   │   ├── page.tsx                # Landing page
│   │   ├── dashboard/              # Main dashboard
│   │   ├── history/                # History view
│   │   └── summary/                # Summary statistics
│   ├── components/                  # React components
│   ├── fhevm/                      # FHEVM integration utilities
│   ├── hooks/                       # React hooks
│   ├── abi/                         # Generated contract ABIs
│   └── scripts/                     # Build and utility scripts
│
└── README.md                        # This file
```

## 🔧 Available Scripts

### Smart Contracts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all contracts |
| `npm run test` | Run all tests |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate coverage report |
| `npm run lint` | Run linting checks |
| `npm run clean` | Clean build artifacts |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with real relayer |
| `npm run dev:mock` | Start dev server with mock FHEVM (requires local Hardhat node) |
| `npm run build` | Build for production |
| `npm run check:static` | Verify static export compliance |
| `npm run lint` | Run ESLint |

## 🔐 How It Works

1. **Submit Encrypted Metrics**: Users encrypt their emotional fluctuation, social fatigue, and sleep debt metrics on the client side
2. **On-Chain Computation**: The smart contract computes risk scores and caution window status using FHEVM without decrypting the data
3. **Get Private Alert**: Only the user can decrypt and view their results
4. **Review & Improve**: Users can review their history and improve emotional management

## 🛠️ Development

### Contract Development

The `BambooHoldSpeech` contract uses FHEVM to:
- Accept encrypted inputs (euint16)
- Perform encrypted computations (FHE.add, FHE.mul)
- Store encrypted results on-chain
- Emit events for frontend synchronization

### Frontend Development

The frontend supports two modes:

1. **Mock Mode** (`dev:mock`): Uses `@fhevm/mock-utils` for local development
2. **Real Mode** (`dev`): Uses `@zama-fhe/relayer-sdk` for production/testnet

The frontend automatically detects the network and switches between modes.

### Wallet Integration

- Supports EIP-6963 wallet discovery
- Automatic wallet reconnection on page refresh
- Persistent wallet state using `eth_accounts` only
- Real-time chain and account change detection

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [Zama FHEVM Protocol](https://docs.zama.ai/protocol)

## 🧪 Testing

### Contract Tests

```bash
cd fhevm-hardhat-template
npm run test
```

### Frontend Static Export Check

```bash
cd bamboohold-speech-frontend
npm run check:static
```

## 🚢 Deployment

### Contract Deployment

1. Set up environment variables (MNEMONIC, INFURA_API_KEY)
2. Deploy to target network:
   ```bash
   npx hardhat deploy --network <network>
   ```
3. Update frontend ABI and addresses:
   ```bash
   cd bamboohold-speech-frontend
   npm run build  # This runs genabi.mjs automatically
   ```

### Frontend Deployment

The frontend is configured for static export and can be deployed to:
- Vercel
- GitHub Pages
- Any static hosting service

```bash
cd bamboohold-speech-frontend
npm run build
# Deploy the 'out' directory
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/diferenwiki/zama_BambooHold_Speech/issues)
- **FHEVM Documentation**: [docs.zama.ai](https://docs.zama.ai)
- **Zama Community**: [Discord](https://discord.gg/zama)

## 🙏 Acknowledgments

- Built with [Zama FHEVM](https://www.zama.ai/fhevm)
- Powered by [Next.js](https://nextjs.org/)
- Contract development with [Hardhat](https://hardhat.org/)

---

**Built with ❤️ for privacy-preserving emotional wellness**

