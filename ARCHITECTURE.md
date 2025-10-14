# MAK Platform – System Architecture

## Overview

**MAK Platform** is a hybrid blockchain-based ecosystem that integrates **real estate, mortgage, and insurance services** into a unified digital marketplace.  
The platform combines **on-chain smart contracts** for property tokenization and governance with **off-chain infrastructure** for data management, compliance, and AI-driven automation.

This architecture is designed for scalability, auditability, and consumer transparency while reducing transaction costs and friction in real estate transactions.

---

## Core Architectural Layers

### 1. Front-End Application Layer
**Tech Stack:** React / Bubble.io (progressive web app), HTML5, TailwindCSS  
**Purpose:** User interface for buyers, sellers, agents, and lenders.  
**Functions:**
- Property discovery and listings (via Bright MLS or custom API)
- Mortgage calculator and pre-qualification workflows
- Digital document management (offers, disclosures, insurance)
- Wallet connection (MetaMask, Coinbase Wallet)
- Dashboard for property token holdings and transaction history

> Front-end communicates with the backend through REST and Web3 interfaces.

---

### 2. Off-Chain Middleware & API Layer
**Tech Stack:** Node.js / Express, MongoDB or PostgreSQL, Ethers.js / Web3.js  
**Purpose:** Bridges traditional systems (MLS, mortgage APIs, compliance systems) with blockchain logic.

**Key Functions:**
- User authentication and KYC/AML integration  
- Mortgage and insurance rate engine (via third-party APIs)  
- Data caching and off-chain property metadata storage (e.g., IPFS integration planned)
- Smart contract event listening and transaction indexing  
- Role-based access controls (configured via `scripts/setup-roles.js`)

> This layer ensures regulatory data remains compliant and easily accessible while maintaining blockchain transparency for asset transactions.

---

### 3. Blockchain & Smart Contract Layer
**Tech Stack:** Solidity, Truffle / Hardhat, Polygon (MATIC) or Optimism (L2)  
**Contracts:**
- **`PropertyMarketplace.sol`** – Handles property listings, bids, sales, and escrow release conditions.  
- **`PropertyToken.sol`** – Defines ERC-20/721 hybrid tokens representing fractional or whole property ownership.  
- **`Governance.sol`** – (In development) Enables DAO-style voting and fractional governance for tokenized assets.  

**Key Features:**
- Immutable transaction logging  
- Fractional property ownership via tokenization  
- Automated disbursement of sale proceeds  
- Escrow and compliance verification logic  
- Gas-optimized transaction execution on L2  

---

### 4. Data Storage & Security Layer
- **On-chain:** Immutable property tokens, ownership records, and transactional hashes.  
- **Off-chain:** MLS data, documents, user identity data, analytics, and mortgage metadata.  
- **Planned Decentralization:** Integration with IPFS or Arweave for immutable property metadata.  
- **Security:**  
  - Environment variable handling via `.env`  
  - Secure API gateway for web requests  
  - Static analysis tools (MythX / Slither) for smart contract vulnerabilities  
  - CI/CD-integrated testing framework  

---

## Transaction Flow Example

1. **User lists property** through the MAK web app.  
2. Metadata (address, details, pricing) stored in the off-chain DB; reference hash written on-chain.  
3. **Smart contract mints a PropertyToken** (unique token ID for property).  
4. **Buyers interact** via wallet connection to purchase fractional or full ownership.  
5. **Smart contract transfers funds** (escrow release after conditions met).  
6. Ownership transfer is recorded both **on-chain (immutable)** and **off-chain (auditable record)**.  
7. Optionally, mortgage and insurance APIs update loan status or coverage.

---

## System Diagram (High-Level)

┌────────────────────────────┐
│ Front-End UI │
│ (React / Bubble.io) │
└────────────┬───────────────┘
│ REST / Web3
┌────────────▼───────────────┐
│ Off-Chain Middleware │
│ (Node.js / Express API) │
│ - Auth / KYC │
│ - MLS / Mortgage API │
│ - Role Management │
└────────────┬───────────────┘
│ Web3 RPC Calls
┌────────────▼───────────────┐
│ Smart Contracts Layer │
│ (Solidity / Polygon L2) │
│ - Marketplace.sol │
│ - Token.sol │
│ - Governance.sol │
└────────────┬───────────────┘
│
┌────────────▼───────────────┐
│ Storage & Security │
│ - MongoDB / IPFS │
│ - Audit logs / CI/CD │
└────────────────────────────┘

---

## Development Environments

- **Local:** Hardhat or Truffle suite for unit testing (`npm run test`)  
- **Staging:** Polygon Mumbai testnet  
- **Production:** Polygon / Optimism mainnet  
- **Contracts:** Deployed via `scripts/deploy.js` (planned)  
- **Environment Variables:** Defined in `.env` and `.env.example`

---

## Roadmap (Q4 2025 – 2026)

| Phase | Goal | Deliverables |
|-------|------|--------------|
| Phase 1 | MVP Launch | Property listings + Token minting + Basic marketplace |
| Phase 2 | Mortgage & Insurance APIs | Rate engine + integrations |
| Phase 3 | Governance Model | DAO framework + voting logic |
| Phase 4 | Mobile & Multi-chain Support | iOS/Android app + cross-chain bridge |
| Phase 5 | Full Decentralization | IPFS/Arweave storage + identity layer |

---

## Contributors

- **Lead Architect:** Michael Kelczewski  
- **Repository:** [andrewk529/mak-platform](https://github.com/andrewk529/mak-platform)  
- **Maintainer:** MAK Holdings, Inc.  

For contributing guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).  
For security and vulnerability reporting, see [SECURITY.md](./SECURITY.md).

---

