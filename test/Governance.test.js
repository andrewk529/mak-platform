const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Governance Contract", function () {
  async function deployGovernanceFixture() {
    const [owner, voter1, voter2, voter3, addr4] = await ethers.getSigners();

    const Governance = await ethers.getContractFactory("Governance");
    const governance = await Governance.deploy();
    await governance.deployed();

    return { governance, owner, voter1, voter2, voter3, addr4 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      const DEFAULT_ADMIN_ROLE = await governance.DEFAULT_ADMIN_ROLE();
      expect(await governance.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(true);
    });

    it("Should set initial parameters correctly", async function () {
      const { governance } = await loadFixture(deployGovernanceFixture);
      
      const votingPeriod = await governance.votingPeriod();
      const quorum = await governance.quorumPercentage();
      
      expect(votingPeriod).to.be.greaterThan(0);
      expect(quorum).to.be.greaterThan(0);
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal successfully", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      const description = "Update platform fee to 2%";
      const targets = [ethers.constants.AddressZero];
      const values = [0];
      const calldatas = ["0x"];
      
      await expect(
        governance.createProposal(description, targets, values, calldatas)
      ).to.emit(governance, "ProposalCreated")
        .withArgs(1, owner.address, description);
    });

    it("Should increment proposal IDs correctly", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Proposal 1", [ethers.constants.AddressZero], [0], ["0x"]);
      await governance.createProposal("Proposal 2", [ethers.constants.AddressZero], [0], ["0x"]);
      
      const proposal1 = await governance.getProposal(1);
      const proposal2 = await governance.getProposal(2);
      
      expect(proposal1.id).to.equal(1);
      expect(proposal2.id).to.equal(2);
    });

    it("Should store proposal details correctly", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      const description = "Test Proposal";
      await governance.createProposal(description, [ethers.constants.AddressZero], [0], ["0x"]);
      
      const proposal = await governance.getProposal(1);
      expect(proposal.description).to.equal(description);
      expect(proposal.proposer).to.equal(owner.address);
      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(0);
    });

    it("Should fail with empty description", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await expect(
        governance.createProposal("", [ethers.constants.AddressZero], [0], ["0x"])
      ).to.be.reverted;
    });

    it("Should fail with mismatched array lengths", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await expect(
        governance.createProposal(
          "Test",
          [ethers.constants.AddressZero, ethers.constants.AddressZero],
          [0],
          ["0x"]
        )
      ).to.be.reverted;
    });
  });

  describe("Voting", function () {
    it("Should allow voting on active proposal", async function () {
      const { governance, owner, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await expect(governance.connect(voter1).castVote(1, 1)) // 1 = For
        .to.emit(governance, "VoteCast")
        .withArgs(voter1.address, 1, 1);
    });

    it("Should count for votes correctly", async function () {
      const { governance, owner, voter1, voter2 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await governance.connect(voter1).castVote(1, 1); // For
      await governance.connect(voter2).castVote(1, 1); // For
      
      const proposal = await governance.getProposal(1);
      expect(proposal.forVotes).to.equal(2);
    });

    it("Should count against votes correctly", async function () {
      const { governance, owner, voter1, voter2 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await governance.connect(voter1).castVote(1, 0); // Against
      await governance.connect(voter2).castVote(1, 0); // Against
      
      const proposal = await governance.getProposal(1);
      expect(proposal.againstVotes).to.equal(2);
    });

    it("Should count abstain votes correctly", async function () {
      const { governance, owner, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await governance.connect(voter1).castVote(1, 2); // Abstain
      
      const proposal = await governance.getProposal(1);
      expect(proposal.abstainVotes).to.equal(1);
    });

    it("Should prevent double voting", async function () {
      const { governance, owner, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await governance.connect(voter1).castVote(1, 1);
      
      await expect(
        governance.connect(voter1).castVote(1, 1)
      ).to.be.reverted;
    });

    it("Should fail voting on non-existent proposal", async function () {
      const { governance, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await expect(
        governance.connect(voter1).castVote(999, 1)
      ).to.be.reverted;
    });

    it("Should fail with invalid vote type", async function () {
      const { governance, owner, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await expect(
        governance.connect(voter1).castVote(1, 3) // Invalid vote type
      ).to.be.reverted;
    });
  });

  describe("Proposal States", function () {
    it("Should start in Pending state", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      const state = await governance.getProposalState(1);
      expect(state).to.equal(0); // Pending
    });

    it("Should transition to Active after delay", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      // Fast forward past voting delay
      const votingDelay = await governance.votingDelay();
      await time.increase(votingDelay.toNumber() + 1);
      
      const state = await governance.getProposalState(1);
      expect(state).to.equal(1); // Active
    });

    it("Should transition to Succeeded if quorum reached", async function () {
      const { governance, owner, voter1, voter2, voter3 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      // Move to active state
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      // Vote
      await governance.connect(voter1).castVote(1, 1);
      await governance.connect(voter2).castVote(1, 1);
      await governance.connect(voter3).castVote(1, 1);
      
      // Move past voting period
      await time.increase((await governance.votingPeriod()).toNumber() + 1);
      
      const state = await governance.getProposalState(1);
      expect(state).to.equal(4); // Succeeded
    });

    it("Should transition to Defeated if rejected", async function () {
      const { governance, owner, voter1, voter2 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      await governance.connect(voter1).castVote(1, 0); // Against
      await governance.connect(voter2).castVote(1, 0); // Against
      
      await time.increase((await governance.votingPeriod()).toNumber() + 1);
      
      const state = await governance.getProposalState(1);
      expect(state).to.equal(3); // Defeated
    });
  });

  describe("Proposal Execution", function () {
    it("Should queue successful proposal", async function () {
      const { governance, owner, voter1, voter2, voter3 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      await governance.connect(voter1).castVote(1, 1);
      await governance.connect(voter2).castVote(1, 1);
      await governance.connect(voter3).castVote(1, 1);
      
      await time.increase((await governance.votingPeriod()).toNumber() + 1);
      
      await expect(governance.queueProposal(1))
        .to.emit(governance, "ProposalQueued")
        .withArgs(1);
    });

    it("Should execute queued proposal after timelock", async function () {
      const { governance, owner, voter1, voter2, voter3 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      await governance.connect(voter1).castVote(1, 1);
      await governance.connect(voter2).castVote(1, 1);
      await governance.connect(voter3).castVote(1, 1);
      
      await time.increase((await governance.votingPeriod()).toNumber() + 1);
      
      await governance.queueProposal(1);
      
      // Wait for timelock
      await time.increase((await governance.timelockPeriod()).toNumber() + 1);
      
      await expect(governance.executeProposal(1))
        .to.emit(governance, "ProposalExecuted")
        .withArgs(1);
    });

    it("Should fail to execute before timelock", async function () {
      const { governance, owner, voter1, voter2, voter3 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      await governance.connect(voter1).castVote(1, 1);
      await governance.connect(voter2).castVote(1, 1);
      await governance.connect(voter3).castVote(1, 1);
      
      await time.increase((await governance.votingPeriod()).toNumber() + 1);
      
      await governance.queueProposal(1);
      
      await expect(
        governance.executeProposal(1)
      ).to.be.reverted;
    });

    it("Should fail to execute defeated proposal", async function () {
      const { governance, owner, voter1, voter2 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      await governance.connect(voter1).castVote(1, 0);
      await governance.connect(voter2).castVote(1, 0);
      
      await time.increase((await governance.votingPeriod()).toNumber() + 1);
      
      await expect(
        governance.queueProposal(1)
      ).to.be.reverted;
    });
  });

  describe("Proposal Cancellation", function () {
    it("Should allow proposer to cancel proposal", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await expect(governance.cancelProposal(1))
        .to.emit(governance, "ProposalCancelled")
        .withArgs(1);
    });

    it("Should fail if non-proposer tries to cancel", async function () {
      const { governance, owner, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await expect(
        governance.connect(voter1).cancelProposal(1)
      ).to.be.reverted;
    });
  });

  describe("Parameter Updates", function () {
    it("Should allow updating voting period", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      const newPeriod = 7 * 24 * 60 * 60; // 7 days
      await governance.setVotingPeriod(newPeriod);
      
      expect(await governance.votingPeriod()).to.equal(newPeriod);
    });

    it("Should allow updating quorum percentage", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await governance.setQuorumPercentage(10); // 10%
      
      expect(await governance.quorumPercentage()).to.equal(10);
    });

    it("Should fail if non-owner tries to update parameters", async function () {
      const { governance, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await expect(
        governance.connect(voter1).setVotingPeriod(123456)
      ).to.be.reverted;
    });
  });

  describe("Query Functions", function () {
    it("Should return all proposals", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Proposal 1", [ethers.constants.AddressZero], [0], ["0x"]);
      await governance.createProposal("Proposal 2", [ethers.constants.AddressZero], [0], ["0x"]);
      
      const count = await governance.proposalCount();
      expect(count).to.equal(2);
    });

    it("Should return whether address has voted", async function () {
      const { governance, owner, voter1 } = await loadFixture(deployGovernanceFixture);
      
      await governance.createProposal("Test", [ethers.constants.AddressZero], [0], ["0x"]);
      
      await time.increase((await governance.votingDelay()).toNumber() + 1);
      
      expect(await governance.hasVoted(1, voter1.address)).to.equal(false);
      
      await governance.connect(voter1).castVote(1, 1);
      
      expect(await governance.hasVoted(1, voter1.address)).to.equal(true);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle proposal with multiple actions", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      const targets = [ethers.constants.AddressZero, ethers.constants.AddressZero];
      const values = [0, 0];
      const calldatas = ["0x", "0x"];
      
      await expect(
        governance.createProposal("Multi-action", targets, values, calldatas)
      ).to.not.be.reverted;
    });

    it("Should handle very long descriptions", async function () {
      const { governance, owner } = await loadFixture(deployGovernanceFixture);
      
      const longDescription = "A".repeat(1000);
      
      await expect(
        governance.createProposal(longDescription, [ethers.constants.AddressZero], [0], ["0x"])
      ).to.not.be.reverted;
    });
  });
});
