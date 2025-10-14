const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const PropertyToken = await hre.ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy();
  await propertyToken.deployed();
  console.log("PropertyToken deployed:", propertyToken.address);

  const PropertyMarketplace = await hre.ethers.getContractFactory("PropertyMarketplace");
  const propertyMarketplace = await PropertyMarketplace.deploy(propertyToken.address);
  await propertyMarketplace.deployed();
  console.log("PropertyMarketplace deployed:", propertyMarketplace.address);

  const RevenueDistribution = await hre.ethers.getContractFactory("RevenueDistribution");
  const revenueDistribution = await RevenueDistribution.deploy(propertyToken.address);
  await revenueDistribution.deployed();
  console.log("RevenueDistribution deployed:", revenueDistribution.address);

  const deployments = {
    network: hre.network.name,
    PropertyToken: { address: propertyToken.address },
    PropertyMarketplace: { address: propertyMarketplace.address },
    RevenueDistribution: { address: revenueDistribution.address },
  };

  fs.mkdirSync("./deployments", { recursive: true });
  fs.writeFileSync(`./deployments/${hre.network.name}.json`, JSON.stringify(deployments, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
