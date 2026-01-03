const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("PropertyToken", function () {
  // Fixture for deploying contracts
  async function deployPropertyTokenFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    const PropertyToken = await ethers.getContractFactory("PropertyToken");
    const propertyToken = await PropertyToken.deploy();

    return { propertyToken, owner, addr1, addr2, addr3 };
  }

  describe("Deployment", function () {
    it("Should deploy with correct initial state", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      expect(await propertyToken.owner()).to.equal(owner.address);
    });

    it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const DEFAULT_ADMIN_ROLE = await propertyToken.DEFAULT_ADMIN_ROLE();
      expect(await propertyToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Property Tokenization", function () {
    it("Should tokenize a new property", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const propertyAddress = "123 Main St, City, State 12345";
      const totalShares = 1000;
      const sharePrice = ethers.parseEther("0.1");
      const metadataURI = "ipfs://QmTest123";

      // Grant MINTER_ROLE to owner
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const tx = await propertyToken.tokenizeProperty(
        propertyAddress,
        totalShares,
        sharePrice,
        metadataURI
      );

      await expect(tx)
        .to.emit(propertyToken, "PropertyTokenized")
        .withArgs(1, propertyAddress, totalShares, sharePrice);
    });

    it("Should revert if non-minter tries to tokenize property", async function () {
      const { propertyToken, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      await expect(
        propertyToken.connect(addr1).tokenizeProperty(
          "123 Main St",
          1000,
          ethers.parseEther("0.1"),
          "ipfs://QmTest"
        )
      ).to.be.reverted;
    });

    it("Should revert if total shares is zero", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      await expect(
        propertyToken.tokenizeProperty(
          "123 Main St",
          0, // Zero shares
          ethers.parseEther("0.1"),
          "ipfs://QmTest"
        )
      ).to.be.revertedWith("Total shares must be greater than zero");
    });

    it("Should increment property counter correctly", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      await propertyToken.tokenizeProperty("Property 1", 1000, ethers.parseEther("0.1"), "ipfs://1");
      await propertyToken.tokenizeProperty("Property 2", 2000, ethers.parseEther("0.2"), "ipfs://2");

      const property1 = await propertyToken.properties(1);
      const property2 = await propertyToken.properties(2);

      expect(property1.propertyAddress).to.equal("Property 1");
      expect(property2.propertyAddress).to.equal("Property 2");
    });
  });

  describe("Share Purchases", function () {
    it("Should allow users to purchase shares", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const totalShares = 1000;
      const sharePrice = ethers.parseEther("0.1");
      
      await propertyToken.tokenizeProperty(
        "Property 1",
        totalShares,
        sharePrice,
        "ipfs://test"
      );

      const sharesToBuy = 10;
      const totalCost = sharePrice * BigInt(sharesToBuy);

      await propertyToken.connect(addr1).purchaseShares(1, sharesToBuy, {
        value: totalCost
      });

      const balance = await propertyToken.balanceOf(addr1.address, 1);
      expect(balance).to.equal(sharesToBuy);
    });

    it("Should revert if insufficient payment", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const sharePrice = ethers.parseEther("0.1");
      await propertyToken.tokenizeProperty("Property 1", 1000, sharePrice, "ipfs://test");

      const sharesToBuy = 10;
      const insufficientPayment = sharePrice * BigInt(sharesToBuy) - BigInt(1);

      await expect(
        propertyToken.connect(addr1).purchaseShares(1, sharesToBuy, {
          value: insufficientPayment
        })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if trying to buy zero shares", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      await propertyToken.tokenizeProperty("Property 1", 1000, ethers.parseEther("0.1"), "ipfs://test");

      await expect(
        propertyToken.connect(addr1).purchaseShares(1, 0, { value: 0 })
      ).to.be.revertedWith("Must purchase at least one share");
    });

    it("Should revert if property doesn't exist", async function () {
      const { propertyToken, addr1 } = await loadFixture(deployPropertyTokenFixture);

      await expect(
        propertyToken.connect(addr1).purchaseShares(999, 10, {
          value: ethers.parseEther("1")
        })
      ).to.be.revertedWith("Property does not exist");
    });

    it("Should track total shares sold", async function () {
      const { propertyToken, owner, addr1, addr2 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const sharePrice = ethers.parseEther("0.1");
      await propertyToken.tokenizeProperty("Property 1", 1000, sharePrice, "ipfs://test");

      await propertyToken.connect(addr1).purchaseShares(1, 100, {
        value: sharePrice * 100n
      });

      await propertyToken.connect(addr2).purchaseShares(1, 200, {
        value: sharePrice * 200n
      });

      // Verify total shares sold
      const property = await propertyToken.properties(1);
      expect(property.sharesSold).to.equal(300);
    });
  });

  describe("Access Control", function () {
    it("Should allow admin to grant roles", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, addr1.address);

      expect(await propertyToken.hasRole(MINTER_ROLE, addr1.address)).to.be.true;
    });

    it("Should allow admin to revoke roles", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, addr1.address);
      await propertyToken.revokeRole(MINTER_ROLE, addr1.address);

      expect(await propertyToken.hasRole(MINTER_ROLE, addr1.address)).to.be.false;
    });

    it("Should not allow non-admin to grant roles", async function () {
      const { propertyToken, addr1, addr2 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      
      await expect(
        propertyToken.connect(addr1).grantRole(MINTER_ROLE, addr2.address)
      ).to.be.reverted;
    });
  });

  describe("Pause Functionality", function () {
    it("Should allow pauser to pause contract", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const PAUSER_ROLE = await propertyToken.PAUSER_ROLE();
      await propertyToken.grantRole(PAUSER_ROLE, owner.address);

      await propertyToken.pause();
      expect(await propertyToken.paused()).to.be.true;
    });

    it("Should prevent purchases when paused", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      const PAUSER_ROLE = await propertyToken.PAUSER_ROLE();
      
      await propertyToken.grantRole(MINTER_ROLE, owner.address);
      await propertyToken.grantRole(PAUSER_ROLE, owner.address);

      const sharePrice = ethers.parseEther("0.1");
      await propertyToken.tokenizeProperty("Property 1", 1000, sharePrice, "ipfs://test");

      await propertyToken.pause();

      await expect(
        propertyToken.connect(addr1).purchaseShares(1, 10, {
          value: sharePrice * 10n
        })
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow unpausing", async function () {
      const { propertyToken, owner } = await loadFixture(deployPropertyTokenFixture);
      
      const PAUSER_ROLE = await propertyToken.PAUSER_ROLE();
      await propertyToken.grantRole(PAUSER_ROLE, owner.address);

      await propertyToken.pause();
      await propertyToken.unpause();
      
      expect(await propertyToken.paused()).to.be.false;
    });
  });

  describe("ERC1155 Compliance", function () {
    it("Should support ERC1155 interface", async function () {
      const { propertyToken } = await loadFixture(deployPropertyTokenFixture);
      
      // ERC1155 interface ID
      const ERC1155_INTERFACE_ID = "0xd9b67a26";
      expect(await propertyToken.supportsInterface(ERC1155_INTERFACE_ID)).to.be.true;
    });

    it("Should allow token transfers", async function () {
      const { propertyToken, owner, addr1, addr2 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const sharePrice = ethers.parseEther("0.1");
      await propertyToken.tokenizeProperty("Property 1", 1000, sharePrice, "ipfs://test");

      await propertyToken.connect(addr1).purchaseShares(1, 100, {
        value: sharePrice * 100n
      });

      await propertyToken.connect(addr1).safeTransferFrom(
        addr1.address,
        addr2.address,
        1, // propertyId
        50, // amount
        "0x"
      );

      expect(await propertyToken.balanceOf(addr1.address, 1)).to.equal(50);
      expect(await propertyToken.balanceOf(addr2.address, 1)).to.equal(50);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum shares correctly", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const totalShares = 1000;
      const sharePrice = ethers.parseEther("0.1");
      await propertyToken.tokenizeProperty("Property 1", totalShares, sharePrice, "ipfs://test");

      // Try to buy all shares
      await propertyToken.connect(addr1).purchaseShares(1, totalShares, {
        value: sharePrice * BigInt(totalShares)
      });

      expect(await propertyToken.balanceOf(addr1.address, 1)).to.equal(totalShares);
    });

    it("Should revert when buying more shares than available", async function () {
      const { propertyToken, owner, addr1 } = await loadFixture(deployPropertyTokenFixture);
      
      const MINTER_ROLE = await propertyToken.MINTER_ROLE();
      await propertyToken.grantRole(MINTER_ROLE, owner.address);

      const totalShares = 100;
      const sharePrice = ethers.parseEther("0.1");
      await propertyToken.tokenizeProperty("Property 1", totalShares, sharePrice, "ipfs://test");

      await expect(
        propertyToken.connect(addr1).purchaseShares(1, totalShares + 1, {
          value: sharePrice * BigInt(totalShares + 1)
        })
      ).to.be.revertedWith("Not enough shares available");
    });
  });
});
