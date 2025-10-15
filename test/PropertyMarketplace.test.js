const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PropertyMarketplace Contract", function () {
  async function deployMarketplaceFixture() {
    const [owner, seller, buyer, addr3] = await ethers.getSigners();

    // Deploy PropertyToken first
    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy();
    await propertyToken.deployed();

    // Deploy Marketplace
    const PropertyMarketplace = await ethers.getContractFactory("PropertyMarketplace");
    const marketplace = await PropertyMarketplace.deploy(propertyToken.address, 250); // 2.5% fee
    await marketplace.deployed();

    // Setup: Create a property and mint shares to seller
    await propertyToken.createProperty(
      "ipfs://test",
      1000,
      ethers.utils.parseEther("0.1"),
      owner.address
    );
    await propertyToken.mintShares(1, seller.address, 500);

    // Approve marketplace to transfer shares
    await propertyToken.connect(seller).setApprovalForAll(marketplace.address, true);

    return { propertyToken, marketplace, owner, seller, buyer, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the correct property token address", async function () {
      const { marketplace, propertyToken } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.propertyToken()).to.equal(propertyToken.address);
    });

    it("Should set the correct platform fee", async function () {
      const { marketplace } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.platformFee()).to.equal(250); // 2.5%
    });

    it("Should set the owner correctly", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      expect(await marketplace.owner()).to.equal(owner.address);
    });
  });

  describe("Listing Shares", function () {
    it("Should create a listing successfully", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.15");
      
      await expect(marketplace.connect(seller).listShares(1, 100, pricePerShare))
        .to.emit(marketplace, "SharesListed")
        .withArgs(1, seller.address, 1, 100, pricePerShare);
    });

    it("Should store listing details correctly", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.15");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      const listing = await marketplace.getListing(1);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.propertyId).to.equal(1);
      expect(listing.amount).to.equal(100);
      expect(listing.pricePerShare).to.equal(pricePerShare);
      expect(listing.active).to.equal(true);
    });

    it("Should fail if listing zero shares", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(seller).listShares(1, 0, ethers.utils.parseEther("0.15"))
      ).to.be.reverted;
    });

    it("Should fail if price is zero", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(seller).listShares(1, 100, 0)
      ).to.be.reverted;
    });

    it("Should fail if seller doesn't have enough shares", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(seller).listShares(1, 1000, ethers.utils.parseEther("0.15"))
      ).to.be.reverted;
    });

    it("Should fail if marketplace not approved", async function () {
      const { propertyToken, marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      // Revoke approval
      await propertyToken.connect(seller).setApprovalForAll(marketplace.address, false);
      
      await expect(
        marketplace.connect(seller).listShares(1, 100, ethers.utils.parseEther("0.15"))
      ).to.be.reverted;
    });
  });

  describe("Buying Shares", function () {
    it("Should allow buying listed shares", async function () {
      const { marketplace, propertyToken, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.15");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      const totalPrice = pricePerShare.mul(50);
      
      await expect(
        marketplace.connect(buyer).buyShares(1, 50, { value: totalPrice })
      ).to.emit(marketplace, "SharesPurchased")
        .withArgs(1, buyer.address, 50, totalPrice);
      
      expect(await propertyToken.balanceOf(buyer.address, 1)).to.equal(50);
    });

    it("Should calculate and deduct platform fee correctly", async function () {
      const { marketplace, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      const amount = 100;
      const totalPrice = pricePerShare.mul(amount);
      const platformFee = totalPrice.mul(250).div(10000); // 2.5%
      const sellerAmount = totalPrice.sub(platformFee);
      
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      await marketplace.connect(buyer).buyShares(1, amount, { value: totalPrice });
      
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(sellerBalanceAfter.sub(sellerBalanceBefore)).to.equal(sellerAmount);
      expect(ownerBalanceAfter.sub(ownerBalanceBefore)).to.equal(platformFee);
    });

    it("Should update listing amount after partial purchase", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      await marketplace.connect(buyer).buyShares(1, 30, { 
        value: pricePerShare.mul(30) 
      });
      
      const listing = await marketplace.getListing(1);
      expect(listing.amount).to.equal(70);
      expect(listing.active).to.equal(true);
    });

    it("Should deactivate listing when fully purchased", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      await marketplace.connect(buyer).buyShares(1, 100, { 
        value: pricePerShare.mul(100) 
      });
      
      const listing = await marketplace.getListing(1);
      expect(listing.active).to.equal(false);
    });

    it("Should fail with insufficient payment", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      const insufficientPayment = pricePerShare.mul(50).sub(1);
      
      await expect(
        marketplace.connect(buyer).buyShares(1, 50, { value: insufficientPayment })
      ).to.be.reverted;
    });

    it("Should fail if buying more than listed", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      await expect(
        marketplace.connect(buyer).buyShares(1, 150, { 
          value: pricePerShare.mul(150) 
        })
      ).to.be.reverted;
    });

    it("Should fail if listing is not active", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      await marketplace.connect(seller).cancelListing(1);
      
      await expect(
        marketplace.connect(buyer).buyShares(1, 50, { 
          value: pricePerShare.mul(50) 
        })
      ).to.be.reverted;
    });
  });

  describe("Canceling Listings", function () {
    it("Should allow seller to cancel listing", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(seller).listShares(1, 100, ethers.utils.parseEther("0.1"));
      
      await expect(marketplace.connect(seller).cancelListing(1))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(1);
      
      const listing = await marketplace.getListing(1);
      expect(listing.active).to.equal(false);
    });

    it("Should fail if non-seller tries to cancel", async function () {
      const { marketplace, seller, buyer } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(seller).listShares(1, 100, ethers.utils.parseEther("0.1"));
      
      await expect(
        marketplace.connect(buyer).cancelListing(1)
      ).to.be.reverted;
    });

    it("Should fail if listing already inactive", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(seller).listShares(1, 100, ethers.utils.parseEther("0.1"));
      await marketplace.connect(seller).cancelListing(1);
      
      await expect(
        marketplace.connect(seller).cancelListing(1)
      ).to.be.reverted;
    });
  });

  describe("Platform Fee Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(owner).setPlatformFee(300); // 3%
      expect(await marketplace.platformFee()).to.equal(300);
    });

    it("Should fail if non-owner tries to update fee", async function () {
      const { marketplace, seller } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(seller).setPlatformFee(300)
      ).to.be.reverted;
    });

    it("Should fail if fee is too high", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      
      await expect(
        marketplace.connect(owner).setPlatformFee(10001) // >100%
      ).to.be.reverted;
    });
  });

  describe("Querying Listings", function () {
    it("Should return active listings for a property", async function () {
      const { marketplace, seller, addr3 } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(seller).listShares(1, 100, ethers.utils.parseEther("0.1"));
      
      // Setup addr3 with shares and list them
      const { propertyToken } = await loadFixture(deployMarketplaceFixture);
      await propertyToken.mintShares(1, addr3.address, 200);
      await propertyToken.connect(addr3).setApprovalForAll(marketplace.address, true);
      await marketplace.connect(addr3).listShares(1, 50, ethers.utils.parseEther("0.12"));
      
      const activeListings = await marketplace.getActiveListings(1);
      expect(activeListings.length).to.be.greaterThan(0);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to pause/unpause marketplace", async function () {
      const { marketplace, owner } = await loadFixture(deployMarketplaceFixture);
      
      await marketplace.connect(owner).pause();
      expect(await marketplace.paused()).to.equal(true);
      
      await marketplace.connect(owner).unpause();
      expect(await marketplace.paused()).to.equal(false);
    });

    it("Should prevent trading when paused", async function () {
      const { marketplace, seller, buyer, owner } = await loadFixture(deployMarketplaceFixture);
      
      const pricePerShare = ethers.utils.parseEther("0.1");
      await marketplace.connect(seller).listShares(1, 100, pricePerShare);
      
      await marketplace.connect(owner).pause();
      
      await expect(
        marketplace.connect(buyer).buyShares(1, 50, { 
          value: pricePerShare.mul(50) 
        })
      ).to.be.reverted;
    });
  });
});
