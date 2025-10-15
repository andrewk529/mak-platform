const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("RevenueDistribution Contract", function () {
  async function deployRevenueDistributionFixture() {
    const [owner, investor1, investor2, investor3] = await ethers.getSigners();

    // Deploy PropertyToken
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy();
    await propertyToken.deployed();

    // Deploy RevenueDistribution
    const RevenueDistribution = await ethers.getContractFactory("RevenueDistribution");
    const revenueDistribution = await RevenueDistribution.deploy(propertyToken.address);
    await revenueDistribution.deployed();

    // Setup: Create property and distribute shares
    await propertyToken.createProperty(
      "ipfs://test",
      1000,
      ethers.utils.parseEther("0.1"),
      owner.address
    );
    
    // Mint shares to investors
    await propertyToken.mintShares(1, investor1.address, 500); // 50%
    await propertyToken.mintShares(1, investor2.address, 300); // 30%
    await propertyToken.mintShares(1, investor3.address, 200); // 20%

    return { propertyToken, revenueDistribution, owner, investor1, investor2, investor3 };
  }

  describe("Deployment", function () {
    it("Should set the correct property token address", async function () {
      const { revenueDistribution, propertyToken } = await loadFixture(deployRevenueDistributionFixture);
      expect(await revenueDistribution.propertyToken()).to.equal(propertyToken.address);
    });

    it("Should set the owner correctly", async function () {
      const { revenueDistribution, owner } = await loadFixture(deployRevenueDistributionFixture);
      const DISTRIBUTOR_ROLE = await revenueDistribution.DISTRIBUTOR_ROLE();
      expect(await revenueDistribution.hasRole(DISTRIBUTOR_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Revenue Distribution", function () {
    it("Should distribute revenue correctly", async function () {
      const { revenueDistribution, owner } = await loadFixture(deployRevenueDistributionFixture);
      
      const revenueAmount = ethers.utils.parseEther("10");
      
      await expect(
        revenueDistribution.connect(owner).distributeRevenue(1, { value: revenueAmount })
      ).to.emit(revenueDistribution, "RevenueDistributed")
        .withArgs(1, revenueAmount, await ethers.provider.getBlockNumber() + 1);
    });

    it("Should calculate per-share amount correctly", async function () {
      const { revenueDistribution, owner, propertyToken } = await loadFixture(deployRevenueDistributionFixture);
      
      const revenueAmount = ethers.utils.parseEther("10");
      await revenueDistribution.connect(owner).distributeRevenue(1, { value: revenueAmount });
      
      // Total shares = 1000, revenue = 10 ETH
      // Per share = 0.01 ETH
      const propertyInfo = await propertyToken.getPropertyInfo(1);
      const expectedPerShare = revenueAmount.div(propertyInfo.mintedShares);
      
      const revenueInfo = await revenueDistribution.getPropertyRevenue(1);
      expect(revenueInfo.totalDistributed).to.equal(revenueAmount);
    });

    it("Should update total distributed amount", async function () {
      const { revenueDistribution, owner } = await loadFixture(deployRevenueDistributionFixture);
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("5") 
      });
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("3") 
      });
      
      const revenueInfo = await revenueDistribution.getPropertyRevenue(1);
      expect(revenueInfo.totalDistributed).to.equal(ethers.utils.parseEther("8"));
    });

    it("Should fail if non-distributor tries to distribute", async function () {
      const { revenueDistribution, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      await expect(
        revenueDistribution.connect(investor1).distributeRevenue(1, { 
          value: ethers.utils.parseEther("10") 
        })
      ).to.be.reverted;
    });

    it("Should fail with zero amount", async function () {
      const { revenueDistribution, owner } = await loadFixture(deployRevenueDistributionFixture);
      
      await expect(
        revenueDistribution.connect(owner).distributeRevenue(1, { value: 0 })
      ).to.be.reverted;
    });
  });

  describe("Claiming Revenue", function () {
    it("Should allow investors to claim their share", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      const revenueAmount = ethers.utils.parseEther("10");
      await revenueDistribution.connect(owner).distributeRevenue(1, { value: revenueAmount });
      
      // investor1 has 500 shares out of 1000 = 50%
      const expectedClaim = revenueAmount.mul(500).div(1000);
      
      const balanceBefore = await ethers.provider.getBalance(investor1.address);
      
      const tx = await revenueDistribution.connect(investor1).claimRevenue(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const balanceAfter = await ethers.provider.getBalance(investor1.address);
      
      expect(balanceAfter.add(gasUsed).sub(balanceBefore)).to.equal(expectedClaim);
    });

    it("Should emit RevenueClaimed event", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      
      await expect(revenueDistribution.connect(investor1).claimRevenue(1))
        .to.emit(revenueDistribution, "RevenueClaimed");
    });

    it("Should correctly calculate claimable amount for multiple distributions", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("5") 
      });
      
      const claimable = await revenueDistribution.getClaimableRevenue(investor1.address, 1);
      
      // investor1 has 50% of shares, total revenue = 15 ETH
      expect(claimable).to.equal(ethers.utils.parseEther("7.5"));
    });

    it("Should not allow claiming twice", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      
      await revenueDistribution.connect(investor1).claimRevenue(1);
      
      // Second claim should give zero
      const claimable = await revenueDistribution.getClaimableRevenue(investor1.address, 1);
      expect(claimable).to.equal(0);
    });

    it("Should handle partial claims correctly", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      // First distribution
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      await revenueDistribution.connect(investor1).claimRevenue(1);
      
      // Second distribution
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("6") 
      });
      
      const claimable = await revenueDistribution.getClaimableRevenue(investor1.address, 1);
      expect(claimable).to.equal(ethers.utils.parseEther("3")); // 50% of 6 ETH
    });

    it("Should fail if no revenue to claim", async function () {
      const { revenueDistribution, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      await expect(
        revenueDistribution.connect(investor1).claimRevenue(1)
      ).to.be.reverted;
    });
  });

  describe("Multiple Investors", function () {
    it("Should distribute proportionally to all investors", async function () {
      const { revenueDistribution, owner, investor1, investor2, investor3 } = await loadFixture(deployRevenueDistributionFixture);
      
      const revenueAmount = ethers.utils.parseEther("10");
      await revenueDistribution.connect(owner).distributeRevenue(1, { value: revenueAmount });
      
      const claimable1 = await revenueDistribution.getClaimableRevenue(investor1.address, 1);
      const claimable2 = await revenueDistribution.getClaimableRevenue(investor2.address, 1);
      const claimable3 = await revenueDistribution.getClaimableRevenue(investor3.address, 1);
      
      // investor1: 50%, investor2: 30%, investor3: 20%
      expect(claimable1).to.equal(ethers.utils.parseEther("5"));
      expect(claimable2).to.equal(ethers.utils.parseEther("3"));
      expect(claimable3).to.equal(ethers.utils.parseEther("2"));
    });

    it("Should allow all investors to claim independently", async function () {
      const { revenueDistribution, owner, investor1, investor2 } = await loadFixture(deployRevenueDistributionFixture);
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      
      await revenueDistribution.connect(investor1).claimRevenue(1);
      
      // investor2 should still be able to claim
      const claimable2 = await revenueDistribution.getClaimableRevenue(investor2.address, 1);
      expect(claimable2).to.equal(ethers.utils.parseEther("3"));
    });
  });

  describe("Query Functions", function () {
    it("Should return correct property revenue info", async function () {
      const { revenueDistribution, owner } = await loadFixture(deployRevenueDistributionFixture);
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      
      const revenueInfo = await revenueDistribution.getPropertyRevenue(1);
      expect(revenueInfo.totalDistributed).to.equal(ethers.utils.parseEther("10"));
      expect(revenueInfo.lastDistribution).to.be.greaterThan(0);
    });

    it("Should return zero for properties without revenue", async function () {
      const { revenueDistribution, propertyToken, owner } = await loadFixture(deployRevenueDistributionFixture);
      
      // Create a second property
      await propertyToken.createProperty(
        "ipfs://test2",
        1000,
        ethers.utils.parseEther("0.1"),
        owner.address
      );
      
      const revenueInfo = await revenueDistribution.getPropertyRevenue(2);
      expect(revenueInfo.totalDistributed).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small revenue amounts", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      const smallAmount = ethers.utils.parseEther("0.001");
      await revenueDistribution.connect(owner).distributeRevenue(1, { value: smallAmount });
      
      const claimable = await revenueDistribution.getClaimableRevenue(investor1.address, 1);
      expect(claimable).to.be.greaterThan(0);
    });

    it("Should handle large revenue amounts", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      const largeAmount = ethers.utils.parseEther("1000");
      await revenueDistribution.connect(owner).distributeRevenue(1, { value: largeAmount });
      
      const claimable = await revenueDistribution.getClaimableRevenue(investor1.address, 1);
      expect(claimable).to.equal(ethers.utils.parseEther("500")); // 50%
    });

    it("Should handle investor with zero shares", async function () {
      const { revenueDistribution, owner } = await loadFixture(deployRevenueDistributionFixture);
      const [, , , , newInvestor] = await ethers.getSigners();
      
      await revenueDistribution.connect(owner).distributeRevenue(1, { 
        value: ethers.utils.parseEther("10") 
      });
      
      const claimable = await revenueDistribution.getClaimableRevenue(newInvestor.address, 1);
      expect(claimable).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow granting distributor role", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      const DISTRIBUTOR_ROLE = await revenueDistribution.DISTRIBUTOR_ROLE();
      await revenueDistribution.connect(owner).grantRole(DISTRIBUTOR_ROLE, investor1.address);
      
      expect(await revenueDistribution.hasRole(DISTRIBUTOR_ROLE, investor1.address)).to.equal(true);
    });

    it("Should allow new distributor to distribute revenue", async function () {
      const { revenueDistribution, owner, investor1 } = await loadFixture(deployRevenueDistributionFixture);
      
      const DISTRIBUTOR_ROLE = await revenueDistribution.DISTRIBUTOR_ROLE();
      await revenueDistribution.connect(owner).grantRole(DISTRIBUTOR_ROLE, investor1.address);
      
      await expect(
        revenueDistribution.connect(investor1).distributeRevenue(1, { 
          value: ethers.utils.parseEther("5") 
        })
      ).to.not.be.reverted;
    });
  });
});
