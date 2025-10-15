const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("PropertyOracle Contract", function () {
  async function deployPropertyOracleFixture() {
    const [owner, oracle1, oracle2, addr3] = await ethers.getSigners();

    const PropertyOracle = await ethers.getContractFactory("PropertyOracle");
    const propertyOracle = await PropertyOracle.deploy();
    await propertyOracle.deployed();

    return { propertyOracle, owner, oracle1, oracle2, addr3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const DEFAULT_ADMIN_ROLE = await propertyOracle.DEFAULT_ADMIN_ROLE();
      expect(await propertyOracle.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should assign oracle role to owner", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
      expect(await propertyOracle.hasRole(ORACLE_ROLE, owner.address)).to.equal(true);
    });
  });

  describe("Property Value Updates", function () {
    it("Should update property value successfully", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const propertyId = 1;
      const newValue = ethers.utils.parseEther("500");
      const dataSource = "Zillow API";
      
      await expect(propertyOracle.updatePropertyValue(propertyId, newValue, dataSource))
        .to.emit(propertyOracle, "PropertyValueUpdated")
        .withArgs(propertyId, newValue, await time.latest() + 1);
    });

    it("Should store property value correctly", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const propertyId = 1;
      const newValue = ethers.utils.parseEther("500");
      
      await propertyOracle.updatePropertyValue(propertyId, newValue, "Test Source");
      
      const valueData = await propertyOracle.getPropertyValue(propertyId);
      expect(valueData.value).to.equal(newValue);
      expect(valueData.lastUpdated).to.be.greaterThan(0);
    });

    it("Should update value multiple times", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await propertyOracle.updatePropertyValue(1, ethers.utils.parseEther("500"), "Source 1");
      await propertyOracle.updatePropertyValue(1, ethers.utils.parseEther("550"), "Source 2");
      
      const valueData = await propertyOracle.getPropertyValue(1);
      expect(valueData.value).to.equal(ethers.utils.parseEther("550"));
    });

    it("Should fail if non-oracle tries to update", async function () {
      const { propertyOracle, addr3 } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.connect(addr3).updatePropertyValue(1, ethers.utils.parseEther("500"), "Test")
      ).to.be.reverted;
    });

    it("Should fail with zero value", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.updatePropertyValue(1, 0, "Test Source")
      ).to.be.reverted;
    });
  });

  describe("Rental Income Updates", function () {
    it("Should update rental income successfully", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const propertyId = 1;
      const monthlyIncome = ethers.utils.parseEther("3.5");
      
      await expect(propertyOracle.updateRentalIncome(propertyId, monthlyIncome))
        .to.emit(propertyOracle, "RentalIncomeUpdated")
        .withArgs(propertyId, monthlyIncome, await time.latest() + 1);
    });

    it("Should store rental income correctly", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const propertyId = 1;
      const monthlyIncome = ethers.utils.parseEther("3.5");
      
      await propertyOracle.updateRentalIncome(propertyId, monthlyIncome);
      
      const incomeData = await propertyOracle.getRentalIncome(propertyId);
      expect(incomeData.monthlyIncome).to.equal(monthlyIncome);
      expect(incomeData.lastUpdated).to.be.greaterThan(0);
    });

    it("Should allow rental income to be zero (vacancy)", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.updateRentalIncome(1, 0)
      ).to.not.be.reverted;
    });

    it("Should track income changes over time", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await propertyOracle.updateRentalIncome(1, ethers.utils.parseEther("3"));
      const firstUpdate = await time.latest();
      
      await time.increase(3600); // 1 hour later
      
      await propertyOracle.updateRentalIncome(1, ethers.utils.parseEther("3.5"));
      
      const incomeData = await propertyOracle.getRentalIncome(1);
      expect(incomeData.monthlyIncome).to.equal(ethers.utils.parseEther("3.5"));
      expect(incomeData.lastUpdated).to.be.greaterThan(firstUpdate);
    });

    it("Should fail if non-oracle tries to update", async function () {
      const { propertyOracle, addr3 } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.connect(addr3).updateRentalIncome(1, ethers.utils.parseEther("3"))
      ).to.be.reverted;
    });
  });

  describe("Occupancy Rate Updates", function () {
    it("Should update occupancy rate successfully", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const propertyId = 1;
      const occupancyRate = 95; // 95%
      
      await expect(propertyOracle.updateOccupancyRate(propertyId, occupancyRate))
        .to.emit(propertyOracle, "OccupancyRateUpdated")
        .withArgs(propertyId, occupancyRate, await time.latest() + 1);
    });

    it("Should store occupancy rate correctly", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await propertyOracle.updateOccupancyRate(1, 90);
      
      const occupancyData = await propertyOracle.getOccupancyRate(1);
      expect(occupancyData.rate).to.equal(90);
    });

    it("Should fail with rate over 100%", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.updateOccupancyRate(1, 101)
      ).to.be.reverted;
    });

    it("Should allow 0% occupancy (vacant)", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.updateOccupancyRate(1, 0)
      ).to.not.be.reverted;
    });

    it("Should allow 100% occupancy", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.updateOccupancyRate(1, 100)
      ).to.not.be.reverted;
    });
  });

  describe("Market Data Updates", function () {
    it("Should update market data successfully", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const location = "Downtown Manhattan";
      const avgPrice = ethers.utils.parseEther("450");
      const medianRent = ethers.utils.parseEther("3.2");
      
      await expect(
        propertyOracle.updateMarketData(location, avgPrice, medianRent)
      ).to.emit(propertyOracle, "MarketDataUpdated");
    });

    it("Should retrieve market data correctly", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const location = "Downtown Manhattan";
      const avgPrice = ethers.utils.parseEther("450");
      const medianRent = ethers.utils.parseEther("3.2");
      
      await propertyOracle.updateMarketData(location, avgPrice, medianRent);
      
      const marketData = await propertyOracle.getMarketData(location);
      expect(marketData.averagePrice).to.equal(avgPrice);
      expect(marketData.medianRent).to.equal(medianRent);
    });
  });

  describe("Batch Updates", function () {
    it("Should update multiple properties at once", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const propertyIds = [1, 2, 3];
      const values = [
        ethers.utils.parseEther("500"),
        ethers.utils.parseEther("600"),
        ethers.utils.parseEther("700")
      ];
      
      await propertyOracle.batchUpdatePropertyValues(propertyIds, values, "Batch Update");
      
      const value1 = await propertyOracle.getPropertyValue(1);
      const value2 = await propertyOracle.getPropertyValue(2);
      const value3 = await propertyOracle.getPropertyValue(3);
      
      expect(value1.value).to.equal(values[0]);
      expect(value2.value).to.equal(values[1]);
      expect(value3.value).to.equal(values[2]);
    });

    it("Should fail if arrays length mismatch", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await expect(
        propertyOracle.batchUpdatePropertyValues(
          [1, 2],
          [ethers.utils.parseEther("500")],
          "Test"
        )
      ).to.be.reverted;
    });
  });

  describe("Data Freshness", function () {
    it("Should track last update timestamp", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const beforeUpdate = await time.latest();
      await propertyOracle.updatePropertyValue(1, ethers.utils.parseEther("500"), "Test");
      
      const valueData = await propertyOracle.getPropertyValue(1);
      expect(valueData.lastUpdated).to.be.greaterThanOrEqual(beforeUpdate);
    });

    it("Should indicate stale data", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await propertyOracle.updatePropertyValue(1, ethers.utils.parseEther("500"), "Test");
      
      // Fast forward 30 days
      await time.increase(30 * 24 * 60 * 60);
      
      const isStale = await propertyOracle.isDataStale(1, 7 * 24 * 60 * 60); // 7 days threshold
      expect(isStale).to.equal(true);
    });

    it("Should indicate fresh data", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await propertyOracle.updatePropertyValue(1, ethers.utils.parseEther("500"), "Test");
      
      const isStale = await propertyOracle.isDataStale(1, 7 * 24 * 60 * 60);
      expect(isStale).to.equal(false);
    });
  });

  describe("Access Control", function () {
    it("Should allow granting oracle role", async function () {
      const { propertyOracle, owner, oracle1 } = await loadFixture(deployPropertyOracleFixture);
      
      const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
      await propertyOracle.grantRole(ORACLE_ROLE, oracle1.address);
      
      expect(await propertyOracle.hasRole(ORACLE_ROLE, oracle1.address)).to.equal(true);
    });

    it("Should allow new oracle to update data", async function () {
      const { propertyOracle, owner, oracle1 } = await loadFixture(deployPropertyOracleFixture);
      
      const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
      await propertyOracle.grantRole(ORACLE_ROLE, oracle1.address);
      
      await expect(
        propertyOracle.connect(oracle1).updatePropertyValue(1, ethers.utils.parseEther("500"), "Test")
      ).to.not.be.reverted;
    });

    it("Should allow revoking oracle role", async function () {
      const { propertyOracle, owner, oracle1 } = await loadFixture(deployPropertyOracleFixture);
      
      const ORACLE_ROLE = await propertyOracle.ORACLE_ROLE();
      await propertyOracle.grantRole(ORACLE_ROLE, oracle1.address);
      await propertyOracle.revokeRole(ORACLE_ROLE, oracle1.address);
      
      await expect(
        propertyOracle.connect(oracle1).updatePropertyValue(1, ethers.utils.parseEther("500"), "Test")
      ).to.be.reverted;
    });
  });

  describe("Query Functions", function () {
    it("Should return zero for non-existent property", async function () {
      const { propertyOracle } = await loadFixture(deployPropertyOracleFixture);
      
      const valueData = await propertyOracle.getPropertyValue(999);
      expect(valueData.value).to.equal(0);
      expect(valueData.lastUpdated).to.equal(0);
    });

    it("Should return complete property data", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      await propertyOracle.updatePropertyValue(1, ethers.utils.parseEther("500"), "Test");
      await propertyOracle.updateRentalIncome(1, ethers.utils.parseEther("3.5"));
      await propertyOracle.updateOccupancyRate(1, 95);
      
      const completeData = await propertyOracle.getCompletePropertyData(1);
      
      expect(completeData.value).to.equal(ethers.utils.parseEther("500"));
      expect(completeData.monthlyIncome).to.equal(ethers.utils.parseEther("3.5"));
      expect(completeData.occupancyRate).to.equal(95);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very large property values", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const largeValue = ethers.utils.parseEther("1000000"); // 1M ETH
      
      await expect(
        propertyOracle.updatePropertyValue(1, largeValue, "Test")
      ).to.not.be.reverted;
    });

    it("Should handle minimal property values", async function () {
      const { propertyOracle, owner } = await loadFixture(deployPropertyOracleFixture);
      
      const minValue = ethers.utils.parseEther("0.01");
      
      await expect(
        propertyOracle.updatePropertyValue(1, minValue, "Test")
      ).to.not.be.reverted;
    });
  });
});
