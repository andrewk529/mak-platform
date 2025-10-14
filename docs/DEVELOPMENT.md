# MAK Platform - Developer Documentation

> Complete guide for developers building on the MAK Platform

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Development Environment](#development-environment)
- [Smart Contract Development](#smart-contract-development)
- [Frontend Development](#frontend-development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js** v18.x or higher ([Download](https://nodejs.org/))
- **npm** v9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **MetaMask** browser extension ([Install](https://metamask.io/))

### Recommended Tools
- **VS Code** with Solidity extension
- **Hardhat** for smart contract development
- **Postman** for API testing
- **Docker** (optional, for containerized development)

### Knowledge Requirements
- JavaScript/TypeScript fundamentals
- React.js and Next.js basics
- Solidity smart contract development
- Basic understanding of blockchain and Web3

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/andrewk529/mak-platform.git
cd mak-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Blockchain Network
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111

# RPC Endpoints
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_for_deployment

# Contract Addresses (after deployment)
NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=
NEXT_PUBLIC_MARKETPLACE_ADDRESS=
NEXT_PUBLIC_REVENUE_DISTRIBUTION_ADDRESS=

# API Keys
COINBASE_API_KEY=your_coinbase_api_key
COINBASE_API_SECRET=your_coinbase_api_secret
OPENAI_API_KEY=your_openai_key_for_ai_features

# Database (if applicable)
DATABASE_URL=postgresql://user:password@localhost:5432/mak_platform

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
# Start the Next.js development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     MAK Platform Stack                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Frontend   │    │   Backend    │    │  Blockchain  │  │
│  │              │    │              │    │              │  │
│  │  React/Next  │◄──►│  Node.js API │◄──►│  Ethereum    │  │
│  │  TypeScript  │    │  Express     │    │  Solidity    │  │
│  │  Tailwind    │    │  GraphQL     │    │  Hardhat     │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│  ┌──────▼────────────────────▼────────────────────▼──────┐  │
│  │              AI/ML Services & Analytics               │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│  │  │ Property   │  │ Market     │  │ Risk       │     │  │
│  │  │ Recomm.    │  │ Analysis   │  │ Assessment │     │  │
│  │  └────────────┘  └────────────┘  └────────────┘     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           External Integrations                       │  │
│  │  • MLS Data APIs  • Oracle Services  • IPFS Storage  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
mak-platform/
├── contracts/              # Solidity smart contracts
│   ├── PropertyToken.sol
│   ├── FractionalOwnership.sol
│   ├── PropertyMarketplace.sol
│   ├── RevenueDistribution.sol
│   ├── PropertyOracle.sol
│   └── Governance.sol
├── src/
│   ├── app/               # Next.js app directory
│   │   ├── page.tsx       # Home page
│   │   ├── properties/    # Property pages
│   │   ├── marketplace/   # Marketplace pages
│   │   └── dashboard/     # User dashboard
│   ├── components/        # React components
│   │   ├── PropertyCard.tsx
│   │   ├── WalletConnect.tsx
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   │   ├── useWeb3.ts
│   │   ├── useContract.ts
│   │   └── ...
│   ├── lib/              # Utility functions
│   │   ├── web3.ts
│   │   ├── api.ts
│   │   └── ...
│   ├── types/            # TypeScript types
│   └── styles/           # CSS/Tailwind styles
├── scripts/              # Deployment & utility scripts
│   ├── deploy.js
│   ├── setup-roles.js
│   └── verify.js
├── test/                 # Test files
│   ├── PropertyToken.test.js
│   ├── Marketplace.test.js
│   └── ...
├── docs/                 # Documentation
├── public/               # Static assets
├── .env.example          # Environment template
├── hardhat.config.js     # Hardhat configuration
├── package.json
└── README.md
```

---

## Development Environment

### Local Blockchain Setup

#### Option 1: Hardhat Network (Recommended)

```bash
# Start local Hardhat node
npx hardhat node

# In a new terminal, deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

#### Option 2: Ganache

```bash
# Install Ganache CLI
npm install -g ganache

# Start Ganache
ganache --port 8545 --chainId 1337
```

### Configure MetaMask for Local Development

1. Open MetaMask
2. Add Network:
   - **Network Name:** Localhost 8545
   - **RPC URL:** http://127.0.0.1:8545
   - **Chain ID:** 31337 (Hardhat) or 1337 (Ganache)
   - **Currency Symbol:** ETH
3. Import test account using private key from Hardhat/Ganache output

---

## Smart Contract Development

### Contract Structure

```solidity
// Example: PropertyToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PropertyToken is ERC1155, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    // Property metadata
    struct Property {
        string propertyAddress;
        uint256 totalShares;
        uint256 pricePerShare;
        bool isActive;
    }
    
    mapping(uint256 => Property) public properties;
    uint256 public propertyCount;
    
    constructor() ERC1155("https://api.makplatform.com/metadata/{id}") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
    }
    
    function mintProperty(
        address to,
        uint256 propertyId,
        uint256 shares,
        string memory propertyAddress
    ) external onlyRole(MINTER_ROLE) {
        // Minting logic
    }
}
```

### Compile Contracts

```bash
# Compile all contracts
npx hardhat compile

# Clean and recompile
npx hardhat clean && npx hardhat compile
```

### Deploy Contracts

```bash
# Deploy to localhost
npx hardhat run scripts/deploy.js --network localhost

# Deploy to testnet (Sepolia)
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to mainnet (use with caution)
npx hardhat run scripts/deploy.js --network mainnet
```

### Verify Contracts on Etherscan

```bash
npx hardhat verify --network sepolia DEPLOYED_CONTRACT_ADDRESS "Constructor Args"
```

---

## Frontend Development

### Component Development

**Example: PropertyCard Component**

```typescript
// src/components/PropertyCard.tsx
import { useState } from 'react';
import { useWeb3 } from '@/hooks/useWeb3';

interface PropertyCardProps {
  propertyId: number;
  address: string;
  totalShares: number;
  pricePerShare: string;
  imageUrl: string;
}

export function PropertyCard({
  propertyId,
  address,
  totalShares,
  pricePerShare,
  imageUrl
}: PropertyCardProps) {
  const { contract, account } = useWeb3();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async (shares: number) => {
    setLoading(true);
    try {
      const tx = await contract.purchaseShares(propertyId, shares);
      await tx.wait();
      // Show success message
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="property-card">
      <img src={imageUrl} alt={address} />
      <h3>{address}</h3>
      <p>Price per share: {pricePerShare} ETH</p>
      <button onClick={() => handlePurchase(1)} disabled={loading}>
        {loading ? 'Processing...' : 'Buy Shares'}
      </button>
    </div>
  );
}
```

### Web3 Integration

**Custom Hook Example:**

```typescript
// src/hooks/useWeb3.ts
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import PropertyTokenABI from '@/abis/PropertyToken.json';

export function useWeb3() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    async function initWeb3() {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS!,
          PropertyTokenABI,
          signer
        );

        setProvider(provider);
        setSigner(signer);
        setAccount(account);
        setContract(contract);
      }
    }

    initWeb3();
  }, []);

  return { provider, signer, account, contract };
}
```

### Styling with Tailwind

```tsx
// Use Tailwind utility classes
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {properties.map(property => (
      <PropertyCard key={property.id} {...property} />
    ))}
  </div>
</div>
```

---

## Testing

### Smart Contract Tests

```javascript
// test/PropertyToken.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PropertyToken", function() {
  let propertyToken;
  let owner, addr1, addr2;

  beforeEach(async function() {
    [owner, addr1, addr2] = await ethers.getSigners();
    
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyToken.deploy();
    await propertyToken.waitForDeployment();
  });

  it("Should mint property tokens", async function() {
    const propertyId = 1;
    const shares = 1000;
    
    await propertyToken.mintProperty(
      addr1.address,
      propertyId,
      shares,
      "123 Main St, NYC"
    );
    
    const balance = await propertyToken.balanceOf(addr1.address, propertyId);
    expect(balance).to.equal(shares);
  });

  it("Should allow share transfers", async function() {
    // Test implementation
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npx hardhat test test/PropertyToken.test.js

# Run with gas reporter
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

### Frontend Testing

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run frontend tests
npm run test:frontend
```

---

## Deployment

### Testnet Deployment (Sepolia)

1. **Get Test ETH:**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Get free test ETH for deployment

2. **Configure Network:**

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    }
  }
};
```

3. **Deploy:**

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

4. **Update Environment:**
   - Copy deployed contract addresses
   - Update `.env` with new addresses
   - Redeploy frontend

### Mainnet Deployment

⚠️ **CAUTION:** Mainnet deployment costs real money and is permanent.

```bash
# Audit contracts first
npm run audit

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Verify on Etherscan
npx hardhat verify --network mainnet CONTRACT_ADDRESS
```

### Frontend Deployment

```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Vercel
vercel deploy --prod
```

---

## API Reference

### Smart Contract Methods

#### PropertyToken.sol

```solidity
// Mint new property tokens
function mintProperty(
    address to,
    uint256 propertyId,
    uint256 shares,
    string memory propertyAddress
) external onlyRole(MINTER_ROLE)

// Get property details
function getProperty(uint256 propertyId) 
    external view returns (Property memory)

// Transfer shares
function safeTransferFrom(
    address from,
    address to,
    uint256 id,
    uint256 amount,
    bytes memory data
) public override
```

#### PropertyMarketplace.sol

```solidity
// List property shares for sale
function listShares(
    uint256 propertyId,
    uint256 shares,
    uint256 pricePerShare
) external

// Purchase listed shares
function purchaseShares(
    uint256 listingId,
    uint256 shares
) external payable

// Cancel listing
function cancelListing(uint256 listingId) external
```

### REST API Endpoints

```
GET    /api/properties          - Get all properties
GET    /api/properties/:id      - Get property details
POST   /api/properties          - Create new property (admin)
PUT    /api/properties/:id      - Update property (admin)
DELETE /api/properties/:id      - Delete property (admin)

GET    /api/marketplace         - Get marketplace listings
POST   /api/marketplace/list    - Create listing
DELETE /api/marketplace/:id     - Cancel listing

GET    /api/users/:address      - Get user profile
GET    /api/users/:address/portfolio - Get user's properties
```

---

## Contributing

### Code Style

- **JavaScript/TypeScript:** ESLint + Prettier
- **Solidity:** Solhint
- **Commits:** Conventional Commits format

```bash
# Run linters
npm run lint

# Auto-fix issues
npm run lint:fix

# Format code
npm run format
```

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit changes (`git commit -m 'feat: add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Open Pull Request

### Commit Message Format

```
feat: add new property listing feature
fix: resolve wallet connection issue
docs: update API documentation
test: add marketplace tests
chore: update dependencies
```

---

## Troubleshooting

### Common Issues

#### 1. "Cannot connect to wallet"

**Solution:**
- Ensure MetaMask is installed and unlocked
- Check network configuration (use correct Chain ID)
- Clear browser cache and restart

#### 2. "Transaction failed"

**Solution:**
```bash
# Check gas settings
# Increase gas limit in transaction
# Verify contract address is correct
# Check wallet has sufficient balance
```

#### 3. "Contract not deployed"

**Solution:**
```bash
# Redeploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Update .env with new addresses
# Restart development server
```

#### 4. "npm install fails"

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm run dev

# Hardhat console
npx hardhat console --network localhost
```

### Get Help

- **GitHub Issues:** [Report bugs](https://github.com/andrewk529/mak-platform/issues)
- **Discord:** Community support (coming soon)
- **Email:** andrewk529@protonmail.com

---

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Last Updated:** October 2025  
**Maintainer:** MAK Platform Team
