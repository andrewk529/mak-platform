# 🚀 MAK Platform Deployment Guide

> **Complete step-by-step guide to deploy MAK Platform smart contracts to testnet and mainnet**

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Pre-Deployment Checklist](#-pre-deployment-checklist)
3. [Deploy to Sepolia Testnet](#-deploy-to-sepolia-testnet)
4. [Verify Contracts](#-verify-contracts)
5. [Test Deployed Contracts](#-test-deployed-contracts)
6. [Deploy to Mainnet](#-deploy-to-mainnet)
7. [Post-Deployment](#-post-deployment)
8. [Troubleshooting](#-troubleshooting)

---

## 🔧 Prerequisites

### **1. Required Tools**

```bash
# Node.js >= 18.0.0
node --version

# npm >= 9.0.0
npm --version

# Git
git --version
```

### **2. Required Accounts**

- ✅ **Ethereum Wallet** with private key
- ✅ **Alchemy/Infura Account** for RPC access
- ✅ **Etherscan Account** for contract verification
- ✅ **Testnet ETH** from Sepolia faucet

### **3. Get Testnet ETH**

Visit these faucets to get free Sepolia ETH:

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Infura Sepolia Faucet](https://www.infura.io/faucet/sepolia)
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)

**Recommended amount**: 0.5 - 1.0 ETH for deployment and testing

---

## ✅ Pre-Deployment Checklist

### **Step 1: Clone and Install**

```bash
# Clone repository (if not already)
git clone https://github.com/andrewk529/mak-platform.git
cd mak-platform

# Install dependencies
npm install

# Verify installation
npx hardhat --version
```

### **Step 2: Configure Environment**

Create `.env` file in project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Deployment wallet private key (DO NOT SHARE!)
PRIVATE_KEY=your_private_key_here_without_0x

# Etherscan API key for verification
ETHERSCAN_API_KEY=your_etherscan_api_key

# Gas reporting (optional)
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key
```

⚠️ **SECURITY WARNING**: 
- Never commit `.env` to git
- Use a separate wallet for testnet
- Use hardware wallet for mainnet

### **Step 3: Get API Keys**

#### **Alchemy (Recommended)**
1. Sign up at [alchemy.com](https://www.alchemy.com/)
2. Create new app → Ethereum → Sepolia
3. Copy API key from Dashboard
4. URL format: `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY`

#### **Etherscan**
1. Sign up at [etherscan.io](https://etherscan.io/)
2. Go to API Keys → Create New
3. Copy API key

### **Step 4: Compile Contracts**

```bash
# Clean previous builds
npx hardhat clean

# Compile contracts
npx hardhat compile

# Check for compilation errors
# Should see: "Compiled X Solidity files successfully"
```

### **Step 5: Run Tests**

```bash
# Run all tests
npm test

# Run with coverage
npm run coverage

# Verify 95%+ coverage before deployment
```

**Expected output**:
```
  PropertyToken
    ✓ Should deploy correctly (523ms)
    ✓ Should tokenize property (1834ms)
    ...

  45 passing (12s)
```

---

## 🧪 Deploy to Sepolia Testnet

### **Step 1: Verify Wallet Balance**

```bash
# Check your balance on Sepolia
npx hardhat run scripts/check-balance.js --network sepolia
```

Expected output:
```
Account: 0x1234...5678
Balance: 0.5 ETH
Status: ✅ Sufficient for deployment
```

### **Step 2: Deploy Contracts**

```bash
# Deploy all contracts to Sepolia
npx hardhat run scripts/deploy.js --network sepolia
```

**Deployment process** (takes 3-5 minutes):

```
🚀 MAK Platform - Smart Contract Deployment
==========================================

📍 Deploying contracts with account: 0x1234...5678
💰 Account balance: 0.5 ETH

📝 Deploying PropertyToken...
✅ PropertyToken deployed to: 0xABCD...1234
⏳ Waiting for confirmations...
✅ PropertyToken confirmed

📝 Deploying PropertyMarketplace...
✅ PropertyMarketplace deployed to: 0xBCDE...2345
⏳ Waiting for confirmations...
✅ PropertyMarketplace confirmed

📝 Deploying RevenueDistribution...
✅ RevenueDistribution deployed to: 0xCDEF...3456
⏳ Waiting for confirmations...
✅ RevenueDistribution confirmed

📝 Deploying PropertyOracle...
✅ PropertyOracle deployed to: 0xDEFA...4567
⏳ Waiting for confirmations...
✅ PropertyOracle confirmed

⚙️  Configuring roles and permissions...
✅ Granted MINTER_ROLE to deployer
✅ Granted DEPOSITOR_ROLE to deployer
✅ Granted ORACLE_ROLE to deployer

💾 Deployment data saved to: deployments/sepolia-1234567890.json
💾 Latest deployment saved to: deployments/sepolia-latest.json

==========================================
✅ DEPLOYMENT COMPLETE
==========================================

📋 Contract Addresses:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PropertyToken:         0xABCD...1234
PropertyMarketplace:   0xBCDE...2345
RevenueDistribution:   0xCDEF...3456
PropertyOracle:        0xDEFA...4567
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Step 3: Save Contract Addresses**

The deployment script automatically saves addresses to:
- `deployments/sepolia-latest.json` (latest deployment)
- `deployments/sepolia-[timestamp].json` (timestamped backup)

**Example deployment file**:
```json
{
  "network": "sepolia",
  "deployer": "0x1234...5678",
  "timestamp": "2025-01-02T12:00:00.000Z",
  "contracts": {
    "PropertyToken": {
      "address": "0xABCD...1234",
      "deploymentBlock": 5123456
    },
    "PropertyMarketplace": {
      "address": "0xBCDE...2345",
      "deploymentBlock": 5123457,
      "constructor": {
        "propertyToken": "0xABCD...1234",
        "feeCollector": "0x1234...5678"
      }
    },
    ...
  }
}
```

---

## ✅ Verify Contracts

### **Option 1: Automated Verification**

```bash
# Verify all contracts on Etherscan
npx hardhat run scripts/verify.js --network sepolia
```

**Expected output**:
```
🔍 MAK Platform - Contract Verification
========================================

📡 Network: sepolia

📝 Verifying PropertyToken...
✅ PropertyToken verified

📝 Verifying PropertyMarketplace...
✅ PropertyMarketplace verified

📝 Verifying RevenueDistribution...
✅ RevenueDistribution verified

📝 Verifying PropertyOracle...
✅ PropertyOracle verified

========================================
✅ VERIFICATION COMPLETE
========================================

🔗 View verified contracts on Etherscan:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PropertyToken:         https://sepolia.etherscan.io/address/0xABCD...1234#code
PropertyMarketplace:   https://sepolia.etherscan.io/address/0xBCDE...2345#code
RevenueDistribution:   https://sepolia.etherscan.io/address/0xCDEF...3456#code
PropertyOracle:        https://sepolia.etherscan.io/address/0xDEFA...4567#code
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Option 2: Manual Verification**

If automated verification fails:

```bash
# Verify each contract individually
npx hardhat verify --network sepolia 0xABCD...1234

npx hardhat verify --network sepolia 0xBCDE...2345 "0xABCD...1234" "0x1234...5678"

npx hardhat verify --network sepolia 0xCDEF...3456 "0xABCD...1234"

npx hardhat verify --network sepolia 0xDEFA...4567
```

---

## 🧪 Test Deployed Contracts

### **Step 1: Create Test Script**

Create `scripts/test-deployment.js`:

```javascript
const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Load deployment
    const deployment = JSON.parse(
        fs.readFileSync("deployments/sepolia-latest.json", "utf8")
    );
    
    // Connect to deployed contracts
    const propertyToken = await ethers.getContractAt(
        "PropertyToken",
        deployment.contracts.PropertyToken.address
    );
    
    console.log("✅ Connected to PropertyToken");
    
    // Test: Tokenize a property
    const tx = await propertyToken.tokenizeProperty(
        "123 Test St, San Francisco, CA",
        1000, // 1000 shares
        ethers.parseEther("0.1"), // 0.1 ETH per share
        "ipfs://QmTest123"
    );
    
    await tx.wait();
    console.log("✅ Property tokenized successfully");
    
    // Get property details
    const property = await propertyToken.properties(1);
    console.log("Property Address:", property.propertyAddress);
    console.log("Total Shares:", property.totalShares.toString());
    console.log("Share Price:", ethers.formatEther(property.sharePrice), "ETH");
}

main().catch(console.error);
```

### **Step 2: Run Test**

```bash
npx hardhat run scripts/test-deployment.js --network sepolia
```

### **Step 3: Interact via Etherscan**

1. Go to your verified contract on Etherscan
2. Click "Contract" → "Write Contract"
3. Connect your wallet
4. Test functions like `tokenizeProperty`, `purchaseShares`

---

## 🌐 Deploy to Mainnet

⚠️ **CRITICAL WARNINGS**:
- ✅ Test thoroughly on Sepolia first
- ✅ Get professional security audit
- ✅ Use hardware wallet for mainnet
- ✅ Double-check all addresses
- ✅ Start with small amounts

### **Step 1: Pre-Mainnet Checklist**

- [ ] Contracts tested on Sepolia for 2+ weeks
- [ ] Security audit completed and issues resolved
- [ ] Bug bounty program launched
- [ ] Team multi-sig wallet configured
- [ ] Emergency pause procedures documented
- [ ] Insurance coverage obtained
- [ ] Legal review completed
- [ ] Regulatory compliance confirmed

### **Step 2: Update Configuration**

```bash
# Update .env with mainnet settings
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_mainnet_private_key

# Use hardware wallet for mainnet (recommended)
# Configure Ledger/Trezor integration
```

### **Step 3: Deploy to Mainnet**

```bash
# Final check
npm test
npm run coverage

# Deploy
npx hardhat run scripts/deploy.js --network mainnet

# Verify
npx hardhat run scripts/verify.js --network mainnet
```

### **Step 4: Mainnet Verification**

Same process as Sepolia, but MUCH more careful:
- Triple-check all addresses
- Test with small amounts first
- Monitor closely for 24-48 hours
- Have rollback plan ready

---

## 📝 Post-Deployment

### **Step 1: Update Documentation**

Update `README.md` with live addresses:

```markdown
## 🌐 Live Contracts (Sepolia Testnet)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| PropertyToken | `0xABCD...1234` | [View](https://sepolia.etherscan.io/address/0xABCD...1234) |
| PropertyMarketplace | `0xBCDE...2345` | [View](https://sepolia.etherscan.io/address/0xBCDE...2345) |
| RevenueDistribution | `0xCDEF...3456` | [View](https://sepolia.etherscan.io/address/0xCDEF...3456) |
| PropertyOracle | `0xDEFA...4567` | [View](https://sepolia.etherscan.io/address/0xDEFA...4567) |
```

### **Step 2: Update Frontend**

Create `.env.local` in your frontend:

```bash
NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=0xABCD...1234
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xBCDE...2345
NEXT_PUBLIC_REVENUE_DISTRIBUTION_ADDRESS=0xCDEF...3456
NEXT_PUBLIC_PROPERTY_ORACLE_ADDRESS=0xDEFA...4567
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_CHAIN_ID=11155111
```

### **Step 3: Monitor Contracts**

Set up monitoring:
- Etherscan alerts for contract interactions
- Tenderly for transaction monitoring
- OpenZeppelin Defender for security monitoring
- Gas price alerts

### **Step 4: Announce Deployment**

- 📢 Tweet deployment announcement
- 📝 Write blog post explaining features
- 📧 Email newsletter subscribers
- 💬 Post in Discord/Telegram
- 📱 Update website with live demo link

---

## 🔧 Troubleshooting

### **Issue: "Insufficient funds for gas"**

**Solution**:
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network sepolia

# Get more testnet ETH from faucets
```

### **Issue: "Nonce too low"**

**Solution**:
```bash
# Reset account nonce
npx hardhat clean
npx hardhat compile
# Try deployment again
```

### **Issue: "Already Verified" error**

**Solution**: This is normal if you've already verified. Skip verification or use different network.

### **Issue: "Network connection failed"**

**Solution**:
```bash
# Check RPC URL is correct
# Try alternative RPC provider
# Check firewall/VPN settings
```

### **Issue: Deployment hangs**

**Solution**:
```bash
# Increase gas price in hardhat.config.js
gasPrice: "auto",

# Or manually set higher gas:
gasPrice: ethers.parseUnits("50", "gwei")
```

### **Issue: Verification fails**

**Solution**:
```bash
# Wait 1-2 minutes after deployment
# Verify Etherscan API key is correct
# Try manual verification with flattened contract:

npx hardhat flatten contracts/PropertyToken.sol > PropertyToken_flat.sol
# Upload to Etherscan manually
```

---

## 📞 Support

**Need Help?**
- 📖 Read [contracts/README.md](../contracts/README.md)
- 🐛 Check [GitHub Issues](https://github.com/andrewk529/mak-platform/issues)
- 💬 Ask in [Discord](https://discord.gg/makplatform) (Coming Soon)
- 📧 Email: andrewk529@protonmail.com

---

## 🎉 Deployment Complete!

Congratulations! Your MAK Platform smart contracts are now live on Sepolia testnet.

**Next steps**:
1. ✅ Share testnet link with early testers
2. ✅ Collect feedback and iterate
3. ✅ Get security audit
4. ✅ Deploy to mainnet when ready

**View your contracts**:
- Sepolia Etherscan: https://sepolia.etherscan.io/address/YOUR_ADDRESS
- Test the platform: https://your-frontend-url.vercel.app

---

<div align="center">

**🚀 Happy Deploying!**

[← Back to Main README](../README.md) • [View Contracts →](../contracts/README.md)

</div>
