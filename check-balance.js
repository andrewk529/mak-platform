const { ethers } = require("hardhat");

async function main() {
    console.log("💰 MAK Platform - Wallet Balance Checker");
    console.log("=========================================\n");

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);

    console.log("📍 Network:", network.name);
    console.log("👤 Account:", deployer.address);
    console.log("💵 Balance:", balanceInEth, "ETH\n");

    // Estimate deployment costs
    const estimatedGas = {
        PropertyToken: 3000000,
        PropertyMarketplace: 3500000,
        RevenueDistribution: 2500000,
        PropertyOracle: 2000000,
    };

    const totalGas = Object.values(estimatedGas).reduce((a, b) => a + b, 0);
    
    // Get current gas price
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice;
    
    const estimatedCostWei = gasPrice * BigInt(totalGas);
    const estimatedCostEth = ethers.formatEther(estimatedCostWei);

    console.log("📊 Estimated Deployment Costs:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Gas Price:", ethers.formatUnits(gasPrice, "gwei"), "gwei");
    console.log("Estimated Total Gas:", totalGas.toLocaleString());
    console.log("Estimated Cost:", estimatedCostEth, "ETH\n");

    // Determine status
    const sufficientFunds = BigInt(balance) > estimatedCostWei * 120n / 100n; // 120% of estimate for safety
    
    if (sufficientFunds) {
        console.log("✅ Status: Sufficient funds for deployment");
        console.log("   You have enough ETH to deploy all contracts");
    } else {
        console.log("⚠️  Status: Insufficient funds");
        console.log(`   Need at least ${estimatedCostEth} ETH (+ 20% buffer)`);
        console.log(`   Current balance: ${balanceInEth} ETH`);
        console.log(`   Additional needed: ${ethers.formatEther(estimatedCostWei * 120n / 100n - BigInt(balance))} ETH\n`);
        
        if (network.name === "sepolia") {
            console.log("💡 Get testnet ETH from faucets:");
            console.log("   • https://sepoliafaucet.com/");
            console.log("   • https://www.infura.io/faucet/sepolia");
            console.log("   • https://faucets.chain.link/sepolia");
        } else {
            console.log("💡 Fund your wallet to proceed with deployment");
        }
    }
    
    console.log("\n=========================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
