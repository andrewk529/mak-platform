#!/bin/bash

# MAK Platform - Test Coverage Setup Script
# This script sets up the complete testing infrastructure

set -e  # Exit on error

echo "🚀 MAK Platform - Test Coverage Setup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js (>=18.0.0) from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm version: $(npm --version)"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p contracts
mkdir -p test/unit
mkdir -p test/integration
mkdir -p test/security
mkdir -p test/helpers
mkdir -p scripts
mkdir -p .github/workflows
mkdir -p docs/audits
echo -e "${GREEN}✓${NC} Directories created"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "This may take a few minutes..."
npm install --save-dev \
    @nomicfoundation/hardhat-chai-matchers \
    @nomicfoundation/hardhat-ethers \
    @nomicfoundation/hardhat-network-helpers \
    @nomicfoundation/hardhat-toolbox \
    @nomicfoundation/hardhat-verify \
    @openzeppelin/hardhat-upgrades \
    @typechain/ethers-v6 \
    @typechain/hardhat \
    chai \
    eslint \
    eslint-config-prettier \
    eslint-plugin-prettier \
    ethers \
    hardhat \
    hardhat-contract-sizer \
    hardhat-gas-reporter \
    prettier \
    prettier-plugin-solidity \
    solhint \
    solidity-coverage \
    typechain

npm install \
    @chainlink/contracts \
    @openzeppelin/contracts \
    @openzeppelin/contracts-upgradeable \
    dotenv

echo -e "${GREEN}✓${NC} Dependencies installed"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ARBITRUM_RPC_URL=https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Deployment
PRIVATE_KEY=your_private_key_here

# Verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# Gas Reporting
REPORT_GAS=true
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Coverage
CODECOV_TOKEN=your_codecov_token_here
EOF
    echo -e "${GREEN}✓${NC} .env file created"
    echo -e "${YELLOW}⚠️  Please update .env with your actual API keys${NC}"
else
    echo -e "${YELLOW}⚠️  .env file already exists, skipping${NC}"
fi
echo ""

# Create .gitignore if it doesn't exist
if [ ! -f .gitignore ]; then
    echo "📝 Creating .gitignore..."
    cat > .gitignore << 'EOF'
node_modules
.env
coverage
coverage.json
typechain
typechain-types

# Hardhat files
cache
artifacts

# Test results
test-results/
gas-report.txt

# Coverage
.coverage_artifacts
.coverage_cache
.coverage_contracts

# IDE
.vscode
.idea
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
EOF
    echo -e "${GREEN}✓${NC} .gitignore created"
else
    echo -e "${YELLOW}⚠️  .gitignore already exists, skipping${NC}"
fi
echo ""

# Compile contracts
echo "🔨 Compiling contracts..."
if npx hardhat compile; then
    echo -e "${GREEN}✓${NC} Contracts compiled successfully"
else
    echo -e "${YELLOW}⚠️  No contracts found or compilation failed${NC}"
    echo "This is normal if you haven't added contracts yet"
fi
echo ""

# Run tests
echo "🧪 Running tests..."
if npm test 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Tests passed"
else
    echo -e "${YELLOW}⚠️  Tests failed or no tests found${NC}"
    echo "This is normal if you haven't written tests yet"
fi
echo ""

# Generate coverage
echo "📊 Generating coverage report..."
if npm run coverage 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Coverage report generated"
    echo "View report at: coverage/index.html"
else
    echo -e "${YELLOW}⚠️  Coverage generation failed${NC}"
    echo "This is normal if contracts don't exist yet"
fi
echo ""

# Final instructions
echo "======================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "======================================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update .env with your API keys"
echo "   - Alchemy/Infura RPC URLs"
echo "   - Private key for deployments"
echo "   - Etherscan API key for verification"
echo ""
echo "2. Set up Codecov:"
echo "   - Sign up at https://codecov.io/"
echo "   - Add your repository"
echo "   - Get upload token"
echo "   - Add CODECOV_TOKEN to GitHub Secrets"
echo ""
echo "3. Add smart contracts to contracts/ directory"
echo ""
echo "4. Write tests in test/ directory"
echo ""
echo "5. Run tests:"
echo "   npm test                  # Run all tests"
echo "   npm run coverage          # Generate coverage"
echo "   npm run coverage:report   # View coverage in browser"
echo ""
echo "6. Push to GitHub to trigger CI/CD:"
echo "   git add ."
echo "   git commit -m \"Set up testing infrastructure\""
echo "   git push origin main"
echo ""
echo "📚 Documentation:"
echo "   - Testing Guide: TESTING.md"
echo "   - Badge Setup: BADGE_SETUP.md"
echo "   - Contracts: contracts/README.md"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
