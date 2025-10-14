// scripts/seed-demo-data.js
// Seed demo ERC-1155 property tokens and (best-effort) create listings.
// Writes a run report to deployments/<network>-demo-output.json

const fs = require("fs");
const path = require("path");
const hre = require("hardhat");
const { ethers } = hre;

function deploymentsPath(network) {
  return path.join(__dirname, "..", "deployments", `${network}.json`);
}

function outputPath(network) {
  return path.join(__dirname, "..", "deployments", `${network}-demo-output.json`);
}

async function loadContract(name, address) {
  const artifact = await hre.artifacts.readArtifact(name);
  const contract = new ethers.Contract(address, artifact.abi, (await ethers.getSigners())[0]);
  return contract;
}

async function approveAll1155(token, operator) {
  const isApproved = await token.isApprovedForAll(await token.signer.getAddress(), operator);
  if (!isApproved) {
    const tx = await token.setApprovalForAll(operator, true);
    const r = await tx.wait();
    return { tx: tx.hash, blockNumber: r.blockNumber };
  }
  return { tx: null, note: "already-approved" };
}

// Tries multiple common mint patterns for ERC-1155 property tokens.
async function tryMint1155(token, to, id, amount, uri = "") {
  const candidates = [
    // OpenZeppelin ERC1155 style
    async () => (await token.mint(to, id, amount, "0x")).wait(),
    async () => (await token.mintBatch(to, [id], [amount], "0x")).wait(),
    // Custom property patterns
    async () => (await token.mintProperty(to, id, amount, uri)).wait(),
    async () => (await token.createProperty(id, amount, uri)).wait(),
    async () => (await token.mintWithURI(to, id, amount, uri)).wait(),
  ];

  for (const fn of candidates) {
    try {
      const rec = await fn();
      return { ok: true, tx: rec.transactionHash, blockNumber: rec.blockNumber };
    } catch (e) {
      // keep trying others
    }
  }
  return { ok: false, error: "No compatible mint function found on PropertyToken." };
}

// Tries several listing method shapes on the marketplace.
async function tryListOnMarketplace(market, tokenAddr, id, amount, pricePerShare) {
  // pricePerShare is in wei (pass ethers.utils.parseEther("X"))
  const cands = [
    async () => (await market.list(tokenAddr, id, amount, pricePerShare)).wait(),
    async () => (await market.createListing(tokenAddr, id, amount, pricePerShare)).wait(),
    async () => (await market.listToken(tokenAddr, id, amount, pricePerShare)).wait(),
    async () => (await market.listingCreate(tokenAddr, id, amount, pricePerShare)).wait(),
  ];
  for (const fn of cands) {
    try {
      const rec = await fn();
      return { ok: true, tx: rec.transactionHash, blockNumber: rec.blockNumber };
    } catch (e) {
      // continue trying
    }
  }
  return { ok: false, error: "No compatible listing function found on PropertyMarketplace." };
}

async function main() {
  const network = hre.network.name;
  const deployFile = deploymentsPath(network);
  if (!fs.existsSync(deployFile)) {
    throw new Error(`Missing deployments file: ${deployFile} — run your deploy script first.`);
  }

  const d = JSON.parse(fs.readFileSync(deployFile, "utf8"));
  const signer = (await ethers.getSigners())[0];
  const deployer = await signer.getAddress();

  // Attach contracts
  const tokenAddr = d.PropertyToken?.address;
  const marketAddr = d.PropertyMarketplace?.address;
  if (!tokenAddr) throw new Error("PropertyToken address not found in deployments file.");
  if (!marketAddr) throw new Error("PropertyMarketplace address not found in deployments file.");

  const token = await loadContract("PropertyToken", tokenAddr);
  const market = await loadContract("PropertyMarketplace", marketAddr);

  // Demo dataset (edit freely)
  // pricePerShare: ether units (e.g. "0.1" => 0.1 ETH)
  const props = [
    { id: 1001, name: "Old Town Alexandria Loft", amount: 1_000, uri: "ipfs://old-town-alx-loft", pricePerShare: "0.05" },
    { id: 1002, name: "Ballston Arlington Condo", amount: 2_000, uri: "ipfs://ballston-arlington-condo", pricePerShare: "0.04" },
    { id: 1003, name: "Del Ray Garden Flat", amount: 1_500, uri: "ipfs://del-ray-garden-flat", pricePerShare: "0.06" },
  ];

  const report = {
    network,
    deployer,
    contracts: { PropertyToken: tokenAddr, PropertyMarketplace: marketAddr },
    steps: [],
  };

  // Approve marketplace to move your ERC1155
  const approval = await approveAll1155(token, marketAddr);
  report.steps.push({ step: "setApprovalForAll(PropertyMarketplace)", result: approval });

  // For each property: mint and list
  for (const p of props) {
    const priceWei = ethers.utils.parseEther(p.pricePerShare);
    const minted = await tryMint1155(token, deployer, p.id, p.amount, p.uri);
    report.steps.push({ step: `mint ${p.name} (#${p.id}, amount=${p.amount})`, result: minted });

    if (!minted.ok) {
      report.steps.push({
        step: `list ${p.name} (#${p.id})`,
        skipped: true,
        reason: "mint failed or ABI mismatch",
      });
      continue;
    }

    const listed = await tryListOnMarketplace(market, tokenAddr, p.id, p.amount, priceWei);
    report.steps.push({
      step: `list ${p.name} (#${p.id}, amount=${p.amount}, pricePerShare=${p.pricePerShare} ETH)`,
      result: listed,
    });
  }

  // Save output
  fs.mkdirSync(path.dirname(outputPath(network)), { recursive: true });
  fs.writeFileSync(outputPath(network), JSON.stringify(report, null, 2));
  console.log(`\n✅ Demo seed complete → ${outputPath(network)}\n`);
  console.log("Summary:");
  for (const s of report.steps) {
    const status =
      s.result?.ok === false ? "❌"
      : s.skipped ? "⏭️"
      : s.result?.note === "already-approved" ? "•"
      : "✓";
    console.log(`${status} ${s.step}`);
  }

  // Helpful hints if ABI mismatches
  const hadMintError = report.steps.some(s => s.step.startsWith("mint") && s.result?.ok === false);
  const hadListError = report.steps.some(s => s.step.startsWith("list") && s.result?.result?.ok === false);
  if (hadMintError) {
    console.warn(
      "\n⚠️ Could not find a compatible mint() function. " +
      "Please expose one of: mint(address,uint256,uint256,bytes), mintBatch, mintProperty, createProperty, or mintWithURI in PropertyToken.\n"
    );
  }
  if (hadListError) {
    console.warn(
      "⚠️ Could not find a compatible listing function. " +
      "Please expose one of: list(address,uint256,uint256,uint256), createListing, listToken, or listingCreate in PropertyMarketplace.\n"
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
