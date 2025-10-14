// scripts/verify-contracts.js
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function verify(address, ctorArgs = []) {
  if (!address) return;
  console.log(`→ Verifying ${address} on ${hre.network.name} ...`);
  try {
    await hre.run("verify:verify", {
      address,
      constructorArguments: ctorArgs,
    });
    console.log(`✓ Verified ${address}`);
  } catch (err) {
    const msg = (err && err.message) || String(err);
    if (msg.includes("Already Verified")) {
      console.log(`• Already verified: ${address}`);
    } else {
      console.warn(`! Verify warning for ${address}: ${msg}`);
    }
  }
}

async function main() {
  const file = path.join(__dirname, "..", "deployments", `${hre.network.name}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing deployments file: ${file}`);
  }
  const d = JSON.parse(fs.readFileSync(file, "utf8"));

  // Adjust constructor args if yours differ
  // PropertyMarketplace(propertyToken), RevenueDistribution(propertyToken)
  const token = d.PropertyToken?.address;
  await verify(d.PropertyToken?.address, []);
  await verify(d.PropertyMarketplace?.address, [token]);
  await verify(d.RevenueDistribution?.address, [token]);

  // Optional extras
  if (d.Governance?.address) await verify(d.Governance.address, []);
  if (d.PropertyOracle?.address) await verify(d.PropertyOracle.address, []);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
