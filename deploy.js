const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 MAK Platform - Smart Contract Deployment");
    console.log("==========================================\n");

    const [deployer] = await ethers.getSigners();
    console.log("📍 Deploying contracts with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Deployment configuration
    const deploymentData = {
        network: network.name,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {}
    };

    try {
        // ============================================
        // 1. Deploy PropertyToken
        // ============================================
        console.log("📝 Deploying PropertyToken...");
        const PropertyToken = await ethers.getContractFactory("PropertyToken");
        const propertyToken = await PropertyToken.deploy();
        await propertyToken.waitForDeployment();
        const propertyTokenAddress = await propertyToken.getAddress();
        
        console.log("✅ PropertyToken deployed to:", propertyTokenAddress);
        deploymentData.contracts.PropertyToken = {
            address: propertyTokenAddress,
            deploymentBlock: propertyToken.deploymentTransaction()?.blockNumber
        };

        // Wait for confirmations
        console.log("⏳ Waiting for confirmations...");
        await propertyToken.deploymentTransaction().wait(5);
        console.log("✅ PropertyToken confirmed\n");

        // ============================================
        // 2. Deploy PropertyMarketplace
        // ============================================
        console.log("📝 Deploying PropertyMarketplace...");
        const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
        const marketplace = await PropertyMarketplace.deploy(
            propertyTokenAddress,
            deployer.address // Fee collector (initially deployer)
        );
        await marketplace.waitForDeployment();
        const marketplaceAddress = await marketplace.getAddress();
        
        console.log("✅ PropertyMarketplace deployed to:", marketplaceAddress);
        deploymentData.contracts.PropertyMarketplace = {
            address: marketplaceAddress,
            deploymentBlock: marketplace.deploymentTransaction()?.blockNumber,
            constructor: {
                propertyToken: propertyTokenAddress,
                feeCollector: deployer.address
            }
        };

        await marketplace.deploymentTransaction().wait(5);
        console.log("✅ PropertyMarketplace confirmed\n");

        // ============================================
        // 3. Deploy RevenueDistribution
        // ============================================
        console.log("📝 Deploying RevenueDistribution...");
        const RevenueDistribution = await ethers.getContractFactory("RevenueDistribution");
        const revenueDistribution = await RevenueDistribution.deploy(propertyTokenAddress);
        await revenueDistribution.waitForDeployment();
        const revenueDistributionAddress = await revenueDistribution.getAddress();
        
        console.log("✅ RevenueDistribution deployed to:", revenueDistributionAddress);
        deploymentData.contracts.RevenueDistribution = {
            address: revenueDistributionAddress,
            deploymentBlock: revenueDistribution.deploymentTransaction()?.blockNumber,
            constructor: {
                propertyToken: propertyTokenAddress
            }
        };

        await revenueDistribution.deploymentTransaction().wait(5);
        console.log("✅ RevenueDistribution confirmed\n");

        // ============================================
        // 4. Deploy PropertyOracle
        // ============================================
        console.log("📝 Deploying PropertyOracle...");
        const PropertyOracle = await ethers.getContractFactory("PropertyOracle");
        const propertyOracle = await PropertyOracle.deploy();
        await propertyOracle.waitForDeployment();
        const propertyOracleAddress = await propertyOracle.getAddress();
        
        console.log("✅ PropertyOracle deployed to:", propertyOracleAddress);
        deploymentData.contracts.PropertyOracle = {
            address: propertyOracleAddress,
            deploymentBlock: propertyOracle.deploymentTransaction()?.blockNumber
        };

        await propertyOracle.deploymentTransaction().wait(5);
        console.log("✅ PropertyOracle confirmed\n");

        // ============================================
        // 5. Configure Roles & Permissions
        // ============================================
        console.log("⚙️  Configuring roles and permissions...");
        
        // Grant MINTER_ROLE to deployer
        const MINTER_ROLE = await propertyToken.MINTER_ROLE();
        await propertyToken.grantRole(MINTER_ROLE, deployer.address);
        console.log("✅ Granted MINTER_ROLE to deployer");

        // Grant DEPOSITOR_ROLE to deployer for revenue distribution
        const DEPOSITOR_ROLE = await revenueDistribution.DEPOSITOR_ROLE();
        await revenueDistribution.grantRole(DEPOSITOR_ROLE, deployer.address);
        console.log("✅ Granted DEPOSITOR_ROLE to deployer");

        // Grant ORACLE_ROLE to deployer
        const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
        await propertyOracle.grantRole(ORACLE_ROLE, deployer.address);
        console.log("✅ Granted ORACLE_ROLE to deployer\n");

        // ============================================
        // 6. Save Deployment Data
        // ============================================
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir, { recursive: true });
        }

        const deploymentFile = path.join(
            deploymentsDir,
            `${network.name}-${Date.now()}.json`
        );
        
        fs.writeFileSync(
            deploymentFile,
            JSON.stringify(deploymentData, null, 2)
        );
        
        console.log("💾 Deployment data saved to:", deploymentFile);

        // Save latest deployment addresses
        const latestFile = path.join(deploymentsDir, `${network.name}-latest.json`);
        fs.writeFileSync(
            latestFile,
            JSON.stringify(deploymentData, null, 2)
        );
        console.log("💾 Latest deployment saved to:", latestFile);

        // ============================================
        // 7. Generate ABI files
        // ============================================
        console.log("\n📦 Generating ABI files...");
        
        const abisDir = path.join(__dirname, "..", "abis");
        if (!fs.existsSync(abisDir)) {
            fs.mkdirSync(abisDir, { recursive: true });
        }

        const contracts = [
            { name: "PropertyToken", artifact: PropertyToken },
            { name: "PropertyMarketplace", artifact: PropertyMarketplace },
            { name: "RevenueDistribution", artifact: RevenueDistribution },
            { name: "PropertyOracle", artifact: PropertyOracle }
        ];

        for (const contract of contracts) {
            const artifact = await ethers.getContractFactory(contract.name);
            const abi = artifact.interface.formatJson();
            const abiFile = path.join(abisDir, `${contract.name}.json`);
            fs.writeFileSync(abiFile, abi);
            console.log(`✅ ${contract.name} ABI saved`);
        }

        // ============================================
        // 8. Print Summary
        // ============================================
        console.log("\n==========================================");
        console.log("✅ DEPLOYMENT COMPLETE");
        console.log("==========================================\n");
        
        console.log("📋 Contract Addresses:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`PropertyToken:         ${propertyTokenAddress}`);
        console.log(`PropertyMarketplace:   ${marketplaceAddress}`);
        console.log(`RevenueDistribution:   ${revenueDistributionAddress}`);
        console.log(`PropertyOracle:        ${propertyOracleAddress}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        console.log("🔍 Next Steps:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("1. Verify contracts on Etherscan:");
        console.log(`   npx hardhat verify --network ${network.name} ${propertyTokenAddress}`);
        console.log(`   npx hardhat verify --network ${network.name} ${marketplaceAddress} "${propertyTokenAddress}" "${deployer.address}"`);
        console.log(`   npx hardhat verify --network ${network.name} ${revenueDistributionAddress} "${propertyTokenAddress}"`);
        console.log(`   npx hardhat verify --network ${network.name} ${propertyOracleAddress}`);
        console.log("\n2. Update your frontend with these addresses");
        console.log("\n3. Test the contracts on testnet before mainnet deployment");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        // Create env template for frontend
        console.log("💡 Environment variables for frontend (.env.local):");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log(`NEXT_PUBLIC_PROPERTY_TOKEN_ADDRESS=${propertyTokenAddress}`);
        console.log(`NEXT_PUBLIC_MARKETPLACE_ADDRESS=${marketplaceAddress}`);
        console.log(`NEXT_PUBLIC_REVENUE_DISTRIBUTION_ADDRESS=${revenueDistributionAddress}`);
        console.log(`NEXT_PUBLIC_PROPERTY_ORACLE_ADDRESS=${propertyOracleAddress}`);
        console.log(`NEXT_PUBLIC_NETWORK_NAME=${network.name}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
