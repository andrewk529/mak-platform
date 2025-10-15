# Makefile
# Command shortcuts for MAK Platform development

.PHONY: help install clean compile test deploy

# Default target
help:
	@echo "MAK Platform - Available Commands"
	@echo "=================================="
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make install          - Install all dependencies"
	@echo "  make clean            - Clean build artifacts"
	@echo ""
	@echo "Development:"
	@echo "  make compile          - Compile smart contracts"
	@echo "  make test             - Run test suite"
	@echo "  make test-gas         - Run tests with gas reporting"
	@echo "  make coverage         - Generate test coverage report"
	@echo "  make node             - Start local Hardhat node"
	@echo "  make frontend         - Start frontend dev server"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy-local     - Deploy to local network"
	@echo "  make deploy-sepolia   - Deploy to Sepolia testnet"
	@echo "  make deploy-mainnet   - Deploy to Ethereum mainnet"
	@echo "  make verify-sepolia   - Verify contracts on Sepolia"
	@echo "  make verify-mainnet   - Verify contracts on mainnet"
	@echo ""
	@echo "Utilities:"
	@echo "  make balance          - Check account balances"
	@echo "  make initialize       - Initialize contracts after deployment"
	@echo "  make seed             - Seed demo data"
	@echo "  make docker-up        - Start Docker containers"
	@echo "  make docker-down      - Stop Docker containers"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint             - Run linter"
	@echo "  make format           - Format code"
	@echo "  make security         - Run security audit"

# ===================================
# Setup & Installation
# ===================================

install:
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Installation complete!"

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf cache artifacts deployments/*.json
	npx hardhat clean
	@echo "✅ Clean complete!"

# ===================================
# Development
# ===================================

compile:
	@echo "🔨 Compiling smart contracts..."
	npx hardhat compile
	@echo "✅ Compilation complete!"

test:
	@echo "🧪 Running test suite..."
	npx hardhat test
	@echo "✅ Tests complete!"

test-gas:
	@echo "⛽ Running tests with gas reporting..."
	REPORT_GAS=true npx hardhat test
	@echo "✅ Tests complete!"

coverage:
	@echo "📊 Generating coverage report..."
	npx hardhat coverage
	@echo "✅ Coverage report generated!"
	@echo "📄 View report: coverage/index.html"

node:
	@echo "🚀 Starting local Hardhat node..."
	npx hardhat node

frontend:
	@echo "⚛️  Starting frontend development server..."
	npm start

# ===================================
# Deployment
# ===================================

deploy-local:
	@echo "🚀 Deploying to local network..."
	npx hardhat run scripts/deploy.js --network localhost
	@echo "✅ Deployment complete!"

deploy-sepolia:
	@echo "🚀 Deploying to Sepolia testnet..."
	@echo "⚠️  Make sure you have:"
	@echo "  - Sufficient Sepolia ETH"
	@echo "  - PRIVATE_KEY in .env"
	@echo "  - INFURA_API_KEY in .env"
	@read -p "Continue? (y/n) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		npx hardhat run scripts/deploy.js --network sepolia; \
		echo "✅ Deployment complete!"; \
	fi

deploy-mainnet:
	@echo "🚀 DEPLOYING TO ETHEREUM MAINNET"
	@echo "=================================="
	@echo "⚠️  WARNING: This will deploy to mainnet!"
	@echo ""
	@echo "Checklist:"
	@echo "  ✅ All tests passing"
	@echo "  ✅ Security audit complete"
	@echo "  ✅ Testnet deployment successful"
	@echo "  ✅ Sufficient ETH for gas"
	@echo ""
	@read -p "Are you ABSOLUTELY sure? Type 'DEPLOY' to continue: " confirm; \
	if [ "$$confirm" = "DEPLOY" ]; then \
		npx hardhat run scripts/deploy.js --network mainnet; \
		echo "✅ Mainnet deployment complete!"; \
	else \
		echo "❌ Deployment cancelled"; \
	fi

verify-sepolia:
	@echo "🔍 Verifying contracts on Sepolia..."
	npx hardhat run scripts/verify-contracts.js --network sepolia
	@echo "✅ Verification complete!"

verify-mainnet:
	@echo "🔍 Verifying contracts on mainnet..."
	npx hardhat run scripts/verify-contracts.js --network mainnet
	@echo "✅ Verification complete!"

# ===================================
# Utilities
# ===================================

balance:
	@echo "💰 Checking balances..."
	npx hardhat run scripts/check-balance.js --network $(NETWORK)

balance-local:
	@$(MAKE) balance NETWORK=localhost

balance-sepolia:
	@$(MAKE) balance NETWORK=sepolia

initialize:
	@echo "⚙️  Initializing contracts..."
	npx hardhat run scripts/initialize.js --network $(NETWORK)
	@echo "✅ Initialization complete!"

initialize-local:
	@$(MAKE) initialize NETWORK=localhost

initialize-sepolia:
	@$(MAKE) initialize NETWORK=sepolia

seed:
	@echo "🌱 Seeding demo data..."
	npx hardhat run scripts/seed-demo-data.js --network $(NETWORK)
	@echo "✅ Seeding complete!"

seed-local:
	@$(MAKE) seed NETWORK=localhost

seed-sepolia:
	@$(MAKE) seed NETWORK=sepolia

# ===================================
# Docker
# ===================================

docker-up:
	@echo "🐳 Starting Docker containers..."
	docker-compose up -d
	@echo "✅ Containers started!"
	@echo "📊 View logs: docker-compose logs -f"

docker-down:
	@echo "🐳 Stopping Docker containers..."
	docker-compose down
	@echo "✅ Containers stopped!"

docker-logs:
	docker-compose logs -f

docker-reset:
	@echo "🐳 Resetting Docker environment..."
	docker-compose down -v
	docker-compose up -d
	@echo "✅ Docker environment reset!"

# ===================================
# Code Quality
# ===================================

lint:
	@echo "🔍 Running linter..."
	npx eslint . --ext .js,.jsx
	npx solhint 'contracts/**/*.sol'
	@echo "✅ Linting complete!"

format:
	@echo "✨ Formatting code..."
	npx prettier --write "**/*.{js,jsx,json,md,sol}"
	@echo "✅ Formatting complete!"

security:
	@echo "🔒 Running security audit..."
	npx hardhat check
	npm audit
	@echo "✅ Security audit complete!"

# ===================================
# Complete Workflows
# ===================================

# Complete local development setup
dev-setup: install compile deploy-local initialize-local seed-local
	@echo "✅ Development environment ready!"
	@echo "🚀 Run 'make node' in one terminal and 'make frontend' in another"

# Complete testnet deployment
testnet-full: compile test deploy-sepolia verify-sepolia initialize-sepolia
	@echo "✅ Testnet deployment complete!"

# Pre-mainnet checklist
pre-mainnet: clean compile test coverage security
	@echo "✅ Pre-mainnet checks complete!"
	@echo "📋 Review:"
	@echo "  - Test results"
	@echo "  - Coverage report"
	@echo "  - Security audit"
	@echo ""
	@echo "Ready for mainnet? Run: make deploy-mainnet"

# Quick test and compile
quick: compile test
	@echo "✅ Quick check complete!"
