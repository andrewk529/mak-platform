const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🔍 MAK Platform - Contract Verification");
    console.log("========================================\n");

    // Get network name
    const networkName = network.name;
    console.log(`📡 Network: ${networkName}\n`);

    // Load latest deployment
    const deploymentFile = path.join(
        __dirname,
        "..",
        "deployments",
        `${networkName}-latest.json`
    );

    if (!fs.existsSync(deploymentFile)) {
        console.error("❌ No deployment found for this network");
        console.error(`   Looking for: ${deploymentFile}`);
        console.error("\n   Please deploy contracts first:");
        console.error(`   npx hardhat run scripts/deploy.js --network ${networkName}`);
        process.exit(1);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
    console.log("✅ Loaded deployment data\n");

    try {
        // ============================================
        // 1. Verify PropertyToken
        // ============================================
        console.log("📝 Verifying PropertyToken...");
        try {
            await run("verify:verify", {
                address: deployment.contracts.PropertyToken.address,
                constructorArguments: [],
            });
            console.log("✅ PropertyToken verified\n");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ PropertyToken already verified\n");
            } else {
                console.error("❌ PropertyToken verification failed:", error.message, "\n");
            }
        }

        // ============================================
        // 2. Verify PropertyMarketplace
        // ============================================
        console.log("📝 Verifying PropertyMarketplace...");
        try {
            await run("verify:verify", {
                address: deployment.contracts.PropertyMarketplace.address,
                constructorArguments: [
                    deployment.contracts.PropertyToken.address,
                    deployment.contracts.PropertyMarketplace.constructor.feeCollector
                ],
            });
            console.log("✅ PropertyMarketplace verified\n");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ PropertyMarketplace already verified\n");
            } else {
                console.error("❌ PropertyMarketplace verification failed:", error.message, "\n");
            }
        }

        // ============================================
        // 3. Verify RevenueDistribution
        // ============================================
        console.log("📝 Verifying RevenueDistribution...");
        try {
            await run("verify:verify", {
                address: deployment.contracts.RevenueDistribution.address,
                constructorArguments: [
                    deployment.contracts.PropertyToken.address
                ],
            });
            console.log("✅ RevenueDistribution verified\n");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ RevenueDistribution already verified\n");
            } else {
                console.error("❌ RevenueDistribution verification failed:", error.message, "\n");
            }
        }

        // ============================================
        // 4. Verify PropertyOracle
        // ============================================
        console.log("📝 Verifying PropertyOracle...");
        try {
            await run("verify:verify", {
                address: deployment.contracts.PropertyOracle.address,
                constructorArguments: [],
            });
            console.log("✅ PropertyOracle verified\n");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ PropertyOracle already verified\n");
            } else {
                console.error("❌ PropertyOracle verification failed:", error.message, "\n");
            }
        }

        // ============================================
        // 5. Summary
        // ============================================
        console.log("========================================");
        console.log("✅ VERIFICATION COMPLETE");
        console.log("========================================\n");

        console.log("🔗 View verified contracts on Etherscan:");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        const explorerUrl = getExplorerUrl(networkName);
        console.log(`PropertyToken:         ${explorerUrl}/address/${deployment.contracts.PropertyToken.address}#code`);
        console.log(`PropertyMarketplace:   ${explorerUrl}/address/${deployment.contracts.PropertyMarketplace.address}#code`);
        console.log(`RevenueDistribution:   ${explorerUrl}/address/${deployment.contracts.RevenueDistribution.address}#code`);
        console.log(`PropertyOracle:        ${explorerUrl}/address/${deployment.contracts.PropertyOracle.address}#code`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    } catch (error) {
        console.error("\n❌ Verification failed:", error);
        process.exit(1);
    }
}

function getExplorerUrl(networkName) {
    const explorers = {
        mainnet: "https://etherscan.io",
        sepolia: "https://sepolia.etherscan.io",
        polygon: "https://polygonscan.com",
        arbitrum: "https://arbiscan.io",
    };
    return explorers[networkName] || "https://etherscan.io";
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
