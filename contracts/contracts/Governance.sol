// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title Governance
 * @notice DAO governance contract for MAK Platform
 */
contract Governance is AccessControl, ReentrancyGuard {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    enum ProposalState { Pending, Active, Succeeded, Defeated, Executed, Cancelled }
    enum ProposalType { ParameterChange, PropertyDecision, PlatformUpgrade, FundAllocation }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        uint256 propertyId;
        string description;
        uint256 startBlock;
        uint256 endBlock;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
        bool cancelled;
    }

    struct Receipt {
        bool hasVoted;
        bool support;
        uint256 votes;
    }

    IERC1155 public propertyToken;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Receipt)) public receipts;
    uint256 public proposalCount;
    uint256 public votingDelay = 1;
    uint256 public votingPeriod = 45818;
    uint256 public proposalThreshold = 100;
    uint256 public quorumPercentage = 2000;
    uint256 public executionDelay = 2 days;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, ProposalType proposalType, uint256 propertyId, string description, uint256 startBlock, uint256 endBlock);
    event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 votes);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event VotingDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);

    error InvalidPropertyToken();
    error InsufficientShares();
    error VotingNotActive();
    error AlreadyVoted();
    error ProposalNotSucceeded();
    error ProposalAlreadyExecuted();
    error ExecutionDelayNotMet();
    error InvalidProposal();
    error InvalidParameter();

    constructor(address propertyToken_) {
        if (propertyToken_ == address(0)) revert InvalidPropertyToken();
        propertyToken = IERC1155(propertyToken_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
    }

    function propose(ProposalType proposalType, uint256 propertyId, string memory description) external returns (uint256) {
        uint256 shares = _getTotalShares(msg.sender);
        if (shares < proposalThreshold) revert InsufficientShares();

        uint256 proposalId = proposalCount++;
        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            proposalType: proposalType,
            propertyId: propertyId,
            description: description,
            startBlock: startBlock,
            endBlock: endBlock,
            forVotes: 0,
            againstVotes: 0,
            executed: false,
            cancelled: false
        });

        emit ProposalCreated(proposalId, msg.sender, proposalType, propertyId, description, startBlock, endBlock);
        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) external nonReentrant {
        if (proposalId >= proposalCount) revert InvalidProposal();
        Proposal storage proposal = proposals[proposalId];
        if (block.number < proposal.startBlock || block.number > proposal.endBlock) revert VotingNotActive();
        if (receipts[proposalId][msg.sender].hasVoted) revert AlreadyVoted();

        uint256 votes;
        if (proposal.proposalType == ProposalType.PropertyDecision) {
            votes = propertyToken.balanceOf(msg.sender, proposal.propertyId);
        } else {
            votes = _getTotalShares(msg.sender);
        }
        if (votes == 0) revert InsufficientShares();

        receipts[proposalId][msg.sender] = Receipt({ hasVoted: true, support: support, votes: votes });
        if (support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }

        emit VoteCast(msg.sender, proposalId, support, votes);
    }

    function execute(uint256 proposalId) external onlyRole(EXECUTOR_ROLE) nonReentrant {
        if (proposalId >= proposalCount) revert InvalidProposal();
        Proposal storage proposal = proposals[proposalId];
        ProposalState currentState = state(proposalId);
        if (currentState != ProposalState.Succeeded) revert ProposalNotSucceeded();
        if (block.number < proposal.endBlock + executionDelay / 12) revert ExecutionDelayNotMet();
        if (proposal.executed) revert ProposalAlreadyExecuted();

        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external {
        if (proposalId >= proposalCount) revert InvalidProposal();
        Proposal storage proposal = proposals[proposalId];
        require(msg.sender == proposal.proposer || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        if (proposal.executed) revert ProposalAlreadyExecuted();
        proposal.cancelled = true;
        emit ProposalCancelled(proposalId);
    }

    function state(uint256 proposalId) public view returns (ProposalState) {
        if (proposalId >= proposalCount) revert InvalidProposal();
        Proposal storage proposal = proposals[proposalId];
        if (proposal.cancelled) return ProposalState.Cancelled;
        if (proposal.executed) return ProposalState.Executed;
        if (block.number < proposal.startBlock) return ProposalState.Pending;
        if (block.number <= proposal.endBlock) return ProposalState.Active;

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 quorumVotes = (_getTotalSupply(proposal.propertyId) * quorumPercentage) / 10000;
        if (totalVotes < quorumVotes || proposal.forVotes <= proposal.againstVotes) {
            return ProposalState.Defeated;
        }
        return ProposalState.Succeeded;
    }

    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        if (proposalId >= proposalCount) revert InvalidProposal();
        return proposals[proposalId];
    }

    function getReceipt(uint256 proposalId, address voter) external view returns (Receipt memory) {
        return receipts[proposalId][voter];
    }

    function getActiveProposals() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < proposalCount; i++) {
            if (state(i) == ProposalState.Active) activeCount++;
        }
        uint256[] memory activeProposals = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < proposalCount; i++) {
            if (state(i) == ProposalState.Active) {
                activeProposals[index] = i;
                index++;
            }
        }
        return activeProposals;
    }

    function hasVotingPower(address account) external view returns (bool) {
        return _getTotalShares(account) >= proposalThreshold;
    }

    function setVotingDelay(uint256 newDelay) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newDelay == 0) revert InvalidParameter();
        uint256 oldDelay = votingDelay;
        votingDelay = newDelay;
        emit VotingDelayUpdated(oldDelay, newDelay);
    }

    function setVotingPeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newPeriod == 0) revert InvalidParameter();
        uint256 oldPeriod = votingPeriod;
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(oldPeriod, newPeriod);
    }

    function setQuorumPercentage(uint256 newQuorum) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newQuorum > 10000) revert InvalidParameter();
        uint256 oldQuorum = quorumPercentage;
        quorumPercentage = newQuorum;
        emit QuorumUpdated(oldQuorum, newQuorum);
    }

    function setProposalThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        proposalThreshold = newThreshold;
    }

    function _getTotalShares(address account) internal view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < 100; i++) {
            total += propertyToken.balanceOf(account, i);
        }
        return total;
    }

    function _getTotalSupply(uint256 propertyId) internal view returns (uint256) {
        return 10000;
    }
}
