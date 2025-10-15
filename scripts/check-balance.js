// scripts/check-balance.js
// Utility to check account balances and contract information

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("💰 MAK Platform Balance Checker\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  // Get network info
  const network = hre.network.name;
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  
  console.log(`📡 Network: ${network}`);
  console.log(`🔗 Chain ID: ${chainId}\n`);

  // Get all signers
  const signers = await hre.ethers.getSigners();
  
  console.log(`👥 Found ${signers.length} accounts\n`);

  // ============================================
  // Check account balances
  // ============================================
  console.log("💵 ACCOUNT BALANCES:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (let i = 0; i < Math.min(signers.length, 10); i++) {
    const address = signers[i].address;
    const balance = await hre.ethers.provider.getBalance(address);
    const balanceEth = hre.ethers.utils.formatEther(balance);
    
    const label = i === 0 ? "Deployer" : `Account ${i}`;
    console.log(`${label.padEnd(12)}: ${address}`);
    console.log(`${"".padEnd(12)}  ${balanceEth} ETH`);
    
    // Warn if balance is low
    if (parseFloat(balanceEth) < 0.1 && network !== "hardhat") {
      console.log(`${"".padEnd(12)}  ⚠️  Low balance! Consider funding this account`);
    }
    console.log();
  }

  // ============================================
  // Check deployed contracts (if available)
  // ============================================
  const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
  
  if (fs.existsSync(deploymentPath)) {
    console.log("\n📜 DEPLOYED CONTRACTS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    
    for (const [name, address] of Object.entries(deployment)) {
      console.log(`\n${name}:`);
      console.log(`  Address: ${address}`);
      
      try {
        // Get contract balance
        const contractBalance = await hre.ethers.provider.getBalance(address);
        const contractBalanceEth = hre.ethers.utils.formatEther(contractBalance);
        console.log(`  Balance: ${contractBalanceEth} ETH`);
        
        // Get contract code size (verify deployment)
        const code = await hre.ethers.provider.getCode(address);
        const codeSize = (code.length - 2) / 2; // Remove '0x' and divide by 2
        console.log(`  Code Size: ${codeSize} bytes`);
        
        if (codeSize === 0) {
          console.log(`  ❌ WARNING: No contract code at this address!`);
        } else {
          console.log(`  ✅ Contract deployed`);
        }

        // Try to get contract-specific info
        if (name === "PropertyToken") {
          try {
            const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
            const contract = PropertyToken.attach(address);
            const propertyCount = await contract.propertyCount();
            console.log(`  Properties: ${propertyCount.toString()}`);
          } catch (e) {
            // Ignore if method doesn't exist
          }
        }

        if (name === "PropertyMarketplace") {
          try {
            const PropertyMarketplace = await hre.ethers.getContractFactory("PropertyMarketplace");
            const contract = PropertyMarketplace.attach(address);
            const platformFee = await contract.platformFee();
            console.log(`  Platform Fee: ${platformFee.toNumber() / 100}%`);
          } catch (e) {
            // Ignore if method doesn't exist
          }
        }

        if (name === "Governance") {
          try {
            const Governance = await hre.ethers.getContractFactory("Governance");
            const contract = Governance.attach(address);
            const proposalCount = await contract.proposalCount();
            console.log(`  Proposals: ${proposalCount.toString()}`);
          } catch (e) {
            // Ignore if method doesn't exist
          }
        }

      } catch (error) {
        console.log(`  ❌ Error checking contract: ${error.message}`);
      }
    }
  } else {
    console.log("\n📜 DEPLOYED CONTRACTS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("No deployment file found for this network.");
    console.log(`Expected: ${deploymentPath}`);
    console.log("\nRun 'npx hardhat run scripts/deploy.js --network <network>' to deploy contracts.");
  }

  // ============================================
  // Gas price info
  // ============================================
  console.log("\n\n⛽ GAS INFORMATION:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  try {
    const gasPrice = await hre.ethers.provider.getGasPrice();
    const gasPriceGwei = hre.ethers.utils.formatUnits(gasPrice, "gwei");
    
    console.log(`Current Gas Price: ${gasPriceGwei} Gwei`);
    
    // Estimate costs for common operations
    const simpleTransferGas = 21000;
    const simpleTransferCost = gasPrice.mul(simpleTransferGas);
    console.log(`\nEstimated costs:`);
    console.log(`  Simple Transfer: ${hre.ethers.utils.formatEther(simpleTransferCost)} ETH (~${simpleTransferGas} gas)`);
    
    // Estimate for contract deployment
    const deployGas = 2000000;
    const deployCost = gasPrice.mul(deployGas);
    console.log(`  Contract Deploy: ${hre.ethers.utils.formatEther(deployCost)} ETH (~${deployGas.toLocaleString()} gas)`);

  } catch (error) {
    console.log(`Unable to fetch gas price: ${error.message}`);
  }

  // ============================================
  // Network-specific faucet info
  // ============================================
  if (network === "sepolia" || network === "goerli") {
    console.log("\n\n🚰 TESTNET FAUCETS:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (network === "sepolia") {
      console.log("Sepolia Faucets:");
      console.log("  - https://sepoliafaucet.com/");
      console.log("  - https://faucet.quicknode.com/ethereum/sepolia");
      console.log("  - https://www.alchemy.com/faucets/ethereum-sepolia");
    }
    
    if (network === "goerli") {
      console.log("Goerli Faucets:");
      console.log("  - https://goerlifaucet.com/");
      console.log("  - https://faucet.quicknode.com/ethereum/goerli");
    }
  }

  // ============================================
  // Summary
  // ============================================
  console.log("\n\n📊 SUMMARY:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  const totalBalance = await hre.ethers.provider.getBalance(signers[0].address);
  const totalBalanceEth = parseFloat(hre.ethers.utils.formatEther(totalBalance));
  
  console.log(`Network: ${network}`);
  console.log(`Deployer Balance: ${totalBalanceEth.toFixed(4)} ETH`);
  
  if (totalBalanceEth < 0.1 && network !== "hardhat" && network !== "localhost") {
    console.log(`\n⚠️  WARNING: Low balance!`);
    console.log(`Recommended: At least 0.5 ETH for deployment and testing`);
  } else if (totalBalanceEth >= 0.1) {
    console.log(`\n✅ Sufficient balance for deployment and testing`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Execute script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
