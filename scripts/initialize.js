// scripts/initialize.js
// Post-deployment initialization script for MAK Platform smart contracts

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting MAK Platform initialization...\n");

  // Get network
  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  // Load deployed contract addresses
  const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.error(`❌ Deployment file not found: ${deploymentPath}`);
    console.error("Please run deploy.js first!");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("📄 Loaded deployment addresses:");
  console.log(JSON.stringify(deployment, null, 2));
  console.log();

  // Get signers
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Initializing with account: ${deployer.address}`);
  console.log(`Account balance: ${hre.ethers.utils.formatEther(await deployer.getBalance())} ETH\n`);

  // Get contract instances
  console.log("📝 Getting contract instances...");
  
  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = PropertyToken.attach(deployment.PropertyToken);

  const PropertyMarketplace = await hre.ethers.getContractFactory("PropertyMarketplace");
  const marketplace = PropertyMarketplace.attach(deployment.PropertyMarketplace);

  const RevenueDistribution = await hre.ethers.getContractFactory("RevenueDistribution");
  const revenueDistribution = RevenueDistribution.attach(deployment.RevenueDistribution);

  const PropertyOracle = await hre.ethers.getContractFactory("PropertyOracle");
  const propertyOracle = PropertyOracle.attach(deployment.PropertyOracle);

  const Governance = await hre.ethers.getContractFactory("Governance");
  const governance = Governance.attach(deployment.Governance);

  console.log("✅ All contract instances loaded\n");

  // ============================================
  // STEP 1: Set up roles and permissions
  // ============================================
  console.log("👤 Step 1: Setting up roles and permissions...");

  try {
    // Grant marketplace approval for token transfers
    console.log("  - Granting marketplace minter role...");
    const MINTER_ROLE = await propertyToken.MINTER_ROLE();
    const hasMinterRole = await propertyToken.hasRole(MINTER_ROLE, marketplace.address);
    
    if (!hasMinterRole) {
      const tx1 = await propertyToken.grantRole(MINTER_ROLE, marketplace.address);
      await tx1.wait();
      console.log("    ✅ Marketplace granted minter role");
    } else {
      console.log("    ℹ️  Marketplace already has minter role");
    }

    // Grant revenue distributor role
    console.log("  - Granting revenue distributor role...");
    const DISTRIBUTOR_ROLE = await revenueDistribution.DISTRIBUTOR_ROLE();
    const hasDistributorRole = await revenueDistribution.hasRole(DISTRIBUTOR_ROLE, deployer.address);
    
    if (!hasDistributorRole) {
      const tx2 = await revenueDistribution.grantRole(DISTRIBUTOR_ROLE, deployer.address);
      await tx2.wait();
      console.log("    ✅ Deployer granted distributor role");
    } else {
      console.log("    ℹ️  Deployer already has distributor role");
    }

    // Grant oracle role
    console.log("  - Setting up oracle permissions...");
    const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
    const hasOracleRole = await propertyOracle.hasRole(ORACLE_ROLE, deployer.address);
    
    if (!hasOracleRole) {
      const tx3 = await propertyOracle.grantRole(ORACLE_ROLE, deployer.address);
      await tx3.wait();
      console.log("    ✅ Deployer granted oracle role");
    } else {
      console.log("    ℹ️  Deployer already has oracle role");
    }

    console.log("✅ Step 1 complete\n");
  } catch (error) {
    console.error("❌ Error in Step 1:", error.message);
  }

  // ============================================
  // STEP 2: Configure platform parameters
  // ============================================
  console.log("⚙️  Step 2: Configuring platform parameters...");

  try {
    // Set platform fee (2.5% = 250 basis points)
    console.log("  - Setting platform fee to 2.5%...");
    const currentFee = await marketplace.platformFee();
    
    if (currentFee.toNumber() !== 250) {
      const tx4 = await marketplace.setPlatformFee(250);
      await tx4.wait();
      console.log("    ✅ Platform fee set to 2.5%");
    } else {
      console.log("    ℹ️  Platform fee already set to 2.5%");
    }

    // Set governance parameters
    console.log("  - Configuring governance parameters...");
    const votingPeriod = 7 * 24 * 60 * 60; // 7 days
    const votingDelay = 1 * 24 * 60 * 60;  // 1 day
    const quorum = 4; // 4%

    const currentVotingPeriod = await governance.votingPeriod();
    if (currentVotingPeriod.toNumber() !== votingPeriod) {
      const tx5 = await governance.setVotingPeriod(votingPeriod);
      await tx5.wait();
      console.log("    ✅ Voting period set to 7 days");
    } else {
      console.log("    ℹ️  Voting period already set");
    }

    const currentQuorum = await governance.quorumPercentage();
    if (currentQuorum.toNumber() !== quorum) {
      const tx6 = await governance.setQuorumPercentage(quorum);
      await tx6.wait();
      console.log("    ✅ Quorum set to 4%");
    } else {
      console.log("    ℹ️  Quorum already set");
    }

    console.log("✅ Step 2 complete\n");
  } catch (error) {
    console.error("❌ Error in Step 2:", error.message);
  }

  // ============================================
  // STEP 3: Verify configuration
  // ============================================
  console.log("🔍 Step 3: Verifying configuration...");

  try {
    console.log("\n📊 Configuration Summary:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // PropertyToken
    console.log("\n🏠 PropertyToken:");
    const PROPERTY_MANAGER_ROLE = await propertyToken.PROPERTY_MANAGER_ROLE();
    const MINTER_ROLE = await propertyToken.MINTER_ROLE();
    console.log(`  - Property Manager: ${await propertyToken.hasRole(PROPERTY_MANAGER_ROLE, deployer.address) ? '✅' : '❌'}`);
    console.log(`  - Minter: ${await propertyToken.hasRole(MINTER_ROLE, deployer.address) ? '✅' : '❌'}`);
    console.log(`  - Marketplace Minter: ${await propertyToken.hasRole(MINTER_ROLE, marketplace.address) ? '✅' : '❌'}`);

    // Marketplace
    console.log("\n🏪 PropertyMarketplace:");
    const platformFee = await marketplace.platformFee();
    console.log(`  - Platform Fee: ${platformFee.toNumber() / 100}%`);
    console.log(`  - Property Token: ${await marketplace.propertyToken()}`);

    // RevenueDistribution
    console.log("\n💰 RevenueDistribution:");
    const DISTRIBUTOR_ROLE = await revenueDistribution.DISTRIBUTOR_ROLE();
    console.log(`  - Distributor: ${await revenueDistribution.hasRole(DISTRIBUTOR_ROLE, deployer.address) ? '✅' : '❌'}`);
    console.log(`  - Property Token: ${await revenueDistribution.propertyToken()}`);

    // PropertyOracle
    console.log("\n🔮 PropertyOracle:");
    const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
    console.log(`  - Oracle: ${await propertyOracle.hasRole(ORACLE_ROLE, deployer.address) ? '✅' : '❌'}`);

    // Governance
    console.log("\n🗳️  Governance:");
    const votingPeriod = await governance.votingPeriod();
    const quorumPercentage = await governance.quorumPercentage();
    console.log(`  - Voting Period: ${votingPeriod.toNumber() / (24 * 60 * 60)} days`);
    console.log(`  - Quorum: ${quorumPercentage.toNumber()}%`);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Step 3 complete\n");
  } catch (error) {
    console.error("❌ Error in Step 3:", error.message);
  }

  // ============================================
  // STEP 4: Save initialization status
  // ============================================
  console.log("💾 Step 4: Saving initialization status...");

  try {
    const initStatus = {
      network,
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: deployment,
      initialized: true,
      configuration: {
        platformFee: "2.5%",
        votingPeriod: "7 days",
        quorum: "4%"
      }
    };

    const statusPath = path.join(__dirname, `../deployments/${network}-init.json`);
    fs.writeFileSync(statusPath, JSON.stringify(initStatus, null, 2));
    
    console.log(`✅ Initialization status saved to: ${statusPath}\n`);
  } catch (error) {
    console.error("❌ Error in Step 4:", error.message);
  }

  // ============================================
  // Complete
  // ============================================
  console.log("🎉 Initialization complete!");
  console.log("\n📝 Next steps:");
  console.log("  1. Run seed-demo-data.js to add sample properties (optional)");
  console.log("  2. Verify contracts on block explorer");
  console.log("  3. Update frontend with contract addresses");
  console.log("  4. Test functionality on testnet");
  console.log("\n✨ MAK Platform is ready to use!\n");
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
