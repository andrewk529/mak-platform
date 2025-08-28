/* scripts/setup-roles.js */
const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function setupRoles() {
  console.log("🔑 Setting up roles...");

  const [deployer] = await ethers.getSigners();
  console.log("Using deployer:", deployer.address);

  // Load deployment file for the current network
  const deploymentPath = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`❌ No deployment file found for network: ${hre.network.name}`);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  // Load deployed contracts
  const propertyToken = await ethers.getContractAt("PropertyToken", deployment.contracts.PropertyToken.address);
  const fractionalOwnership = await ethers.getContractAt("FractionalOwnership", deployment.contracts.FractionalOwnership.address);

  // Role addresses (fall back to deployer if none set in .env)
  const admin = process.env.ADMIN_ADDRESS || deployer.address;
  const operator = process.env.OPERATOR_ADDRESS || deployer.address;

  // Helper: grant role if not already assigned
  async function grantIfNeeded(contract, role, address, label) {
    if (!(await contract.hasRole(role, address))) {
      const tx = await contract.grantRole(role, address);
      await tx.wait();
      console.log(`✅ Granted ${label} to ${address}`);
    } else {
      console.log(`ℹ️ ${label} already assigned to ${address}`);
    }
  }

  // PropertyToken roles
  if (propertyToken.DEFAULT_ADMIN_ROLE) {
    const DEFAULT_ADMIN_ROLE = await propertyToken.DEFAULT_ADMIN_ROLE();
    await grantIfNeeded(propertyToken, DEFAULT_ADMIN_ROLE, admin, "DEFAULT_ADMIN_ROLE");
  }

  if (propertyToken.MINTER_ROLE) {
    const MINTER_ROLE = await propertyToken.MINTER_ROLE();
    await grantIfNeeded(propertyToken, MINTER_ROLE, deployment.contracts.FractionalOwnership.address, "MINTER_ROLE");
  }

  if (propertyToken.PAUSER_ROLE) {
    const PAUSER_ROLE = await propertyToken.PAUSER_ROLE();
    await grantIfNeeded(propertyToken, PAUSER_ROLE, operator, "PAUSER_ROLE");
  }

  // FractionalOwnership roles
  if (fractionalOwnership.OPERATOR_ROLE) {
    const OPERATOR_ROLE = await fractionalOwnership.OPERATOR_ROLE();
    await grantIfNeeded(fractionalOwnership, OPERATOR_ROLE, operator, "OPERATOR_ROLE");
  }

  console.log("🎉 Role setup completed!");
}

if (require.main === module) {
  setupRoles().catch((err) => {
    console.error("❌ Error setting up roles:", err);
    process.exit(1);
  });
}

module.exports = { setupRoles };
