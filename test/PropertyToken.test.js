const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PropertyToken Contract", function () {
  // Fixture to deploy contract before each test
  async function deployPropertyTokenFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy();
    await propertyToken.deployed();

    return { propertyToken, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const DEFAULT_ADMIN_ROLE = await propertyToken.DEFAULT_ADMIN_ROLE();
      expect(await propertyToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should assign admin roles correctly", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const PROPERTY_MANAGER_ROLE = await propertyToken.PROPERTY_MANAGER_ROLE();
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      
      expect(await propertyToken.hasRole(PROPERTY_MANAGER_ROLE, owner.address)).to.equal(true);
      expect(await propertyToken.hasRole(MINTER_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Property Creation", function () {
    it("Should create a property with correct details", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const uri = "ipfs://QmTest123";
      const totalShares = 1000;
      const pricePerShare = ethers.utils.parseEther("0.1");
      
      await expect(propertyToken.createProperty(uri, totalShares, pricePerShare, owner.address))
        .to.emit(propertyToken, "PropertyCreated")
        .withArgs(1, uri, totalShares);
      
      const propertyInfo = await propertyToken.getPropertyInfo(1);
      expect(propertyInfo.uri).to.equal(uri);
      expect(propertyInfo.totalShares).to.equal(totalShares);
      expect(propertyInfo.pricePerShare).to.equal(pricePerShare);
      expect(propertyInfo.active).to.equal(true);
    });

    it("Should increment property IDs correctly", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://property1", 1000, ethers.utils.parseEther("0.1"), owner.address);
      await propertyToken.createProperty("ipfs://property2", 2000, ethers.utils.parseEther("0.2"), owner.address);
      
      const property1 = await propertyToken.getPropertyInfo(1);
      const property2 = await propertyToken.getPropertyInfo(2);
      
      expect(property1.totalShares).to.equal(1000);
      expect(property2.totalShares).to.equal(2000);
    });

    it("Should fail if non-manager tries to create property", async function () {
      const { propertyToken, addr1, owner } = await loadFixture(deployPropertyTokenFixture);
      
      await expect(
        propertyToken.connect(addr1).createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address)
      ).to.be.reverted;
    });

    it("Should fail with zero total shares", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      await expect(
        propertyToken.createProperty("ipfs://test", 0, ethers.utils.parseEther("0.1"), owner.address)
      ).to.be.reverted;
    });
  });

  describe("Share Minting", function () {
    it("Should mint shares to specified address", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address);
      
      await expect(propertyToken.mintShares(1, addr1.address, 100))
        .to.emit(propertyToken, "SharesMinted")
        .withArgs(1, addr1.address, 100);
      
      const balance = await propertyToken.balanceOf(addr1.address, 1);
      expect(balance).to.equal(100);
    });

    it("Should update minted shares count", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address);
      await propertyToken.mintShares(1, addr1.address, 100);
      
      const propertyInfo = await propertyToken.getPropertyInfo(1);
      expect(propertyInfo.mintedShares).to.equal(100);
    });

    it("Should fail if minting exceeds total shares", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 100, ethers.utils.parseEther("0.1"), owner.address);
      
      await expect(
        propertyToken.mintShares(1, addr1.address, 101)
      ).to.be.reverted;
    });

    it("Should fail if non-minter tries to mint", async function () {
      const { propertyToken, owner, addr1, addr2 } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address);
      
      await expect(
        propertyToken.connect(addr1).mintShares(1, addr2.address, 100)
      ).to.be.reverted;
    });
  });

  describe("Share Transfers", function () {
    it("Should allow share transfers between addresses", async function () {
      const { propertyToken, owner, addr1, addr2 } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address);
      await propertyToken.mintShares(1, addr1.address, 100);
      
      await propertyToken.connect(addr1).safeTransferFrom(addr1.address, addr2.address, 1, 50, "0x");
      
      expect(await propertyToken.balanceOf(addr1.address, 1)).to.equal(50);
      expect(await propertyToken.balanceOf(addr2.address, 1)).to.equal(50);
    });

    it("Should support batch transfers", async function () {
      const { propertyToken, owner, addr1, addr2 } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test1", 1000, ethers.utils.parseEther("0.1"), owner.address);
      await propertyToken.createProperty("ipfs://test2", 1000, ethers.utils.parseEther("0.2"), owner.address);
      
      await propertyToken.mintShares(1, addr1.address, 100);
      await propertyToken.mintShares(2, addr1.address, 200);
      
      await propertyToken.connect(addr1).safeBatchTransferFrom(
        addr1.address,
        addr2.address,
        [1, 2],
        [50, 100],
        "0x"
      );
      
      expect(await propertyToken.balanceOf(addr2.address, 1)).to.equal(50);
      expect(await propertyToken.balanceOf(addr2.address, 2)).to.equal(100);
    });
  });

  describe("Property Management", function () {
    it("Should update property price", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address);
      
      const newPrice = ethers.utils.parseEther("0.15");
      await propertyToken.updatePropertyPrice(1, newPrice);
      
      const propertyInfo = await propertyToken.getPropertyInfo(1);
      expect(propertyInfo.pricePerShare).to.equal(newPrice);
    });

    it("Should deactivate property", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://test", 1000, ethers.utils.parseEther("0.1"), owner.address);
      await propertyToken.setPropertyActive(1, false);
      
      const propertyInfo = await propertyToken.getPropertyInfo(1);
      expect(propertyInfo.active).to.equal(false);
    });
  });

  describe("URI Management", function () {
    it("Should return correct URI for property", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const uri = "ipfs://QmPropertyMetadata";
      await propertyToken.createProperty(uri, 1000, ethers.utils.parseEther("0.1"), owner.address);
      
      expect(await propertyToken.uri(1)).to.equal(uri);
    });

    it("Should update property URI", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      await propertyToken.createProperty("ipfs://old", 1000, ethers.utils.parseEther("0.1"), owner.address);
      
      const newUri = "ipfs://new";
      await propertyToken.setPropertyURI(1, newUri);
      
      expect(await propertyToken.uri(1)).to.equal(newUri);
    });
  });

  describe("Access Control", function () {
    it("Should grant and revoke roles", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      
      await propertyToken.grantRole(MINTER_ROLE, addr1.address);
      expect(await propertyToken.hasRole(MINTER_ROLE, addr1.address)).to.equal(true);
      
      await propertyToken.revokeRole(MINTER_ROLE, addr1.address);
      expect(await propertyToken.hasRole(MINTER_ROLE, addr1.address)).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum supply correctly", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const maxShares = 1000000;
      await propertyToken.createProperty("ipfs://test", maxShares, ethers.utils.parseEther("0.1"), owner.address);
      await propertyToken.mintShares(1, addr1.address, maxShares);
      
      const balance = await propertyToken.balanceOf(addr1.address, 1);
      expect(balance).to.equal(maxShares);
    });

    it("Should revert on invalid property ID", async function () {
      const { propertyToken } = await loadFixture(deployPropertyTokenFixture);
      
      await expect(propertyToken.getPropertyInfo(999)).to.be.reverted;
    });
  });
});
