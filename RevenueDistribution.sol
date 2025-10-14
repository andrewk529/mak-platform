// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title RevenueDistribution
 * @notice Manages distribution of rental income to property shareholders
 */
contract RevenueDistribution is ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Distribution {
        uint256 propertyId;
        uint256 totalAmount;
        uint256 timestamp;
        uint256 revenuePerShare;
        uint256 totalShares;
    }

    IERC1155 public propertyToken;
    mapping(uint256 => Distribution[]) public distributions;
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) public claimed;
    mapping(uint256 => uint256) public totalRevenueByProperty;
    mapping(address => uint256) public totalClaimedByUser;
    uint256 public constant SCALE_FACTOR = 1e18;

    event RevenueDeposited(uint256 indexed propertyId, uint256 indexed distributionIndex, uint256 amount, uint256 revenuePerShare, uint256 totalShares);
    event RevenueClaimed(address indexed user, uint256 indexed propertyId, uint256 indexed distributionIndex, uint256 amount);
    event BatchRevenueClaimed(address indexed user, uint256 indexed propertyId, uint256 totalAmount, uint256 distributionsProcessed);

    error InvalidAmount();
    error NothingToClaim();
    error AlreadyClaimed();
    error InvalidPropertyId();
    error NoShares();
    error TransferFailed();
    error InvalidPropertyToken();

    constructor(address propertyToken_) {
        if (propertyToken_ == address(0)) revert InvalidPropertyToken();
        propertyToken = IERC1155(propertyToken_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function depositRevenue(uint256 propertyId) external payable onlyRole(DISTRIBUTOR_ROLE) whenNotPaused {
        if (msg.value == 0) revert InvalidAmount();
        uint256 totalShares = IERC1155Supply(address(propertyToken)).totalSupply(propertyId);
        if (totalShares == 0) revert NoShares();

        uint256 revenuePerShare = (msg.value * SCALE_FACTOR) / totalShares;
        Distribution memory newDistribution = Distribution({
            propertyId: propertyId,
            totalAmount: msg.value,
            timestamp: block.timestamp,
            revenuePerShare: revenuePerShare,
            totalShares: totalShares
        });

        distributions[propertyId].push(newDistribution);
        totalRevenueByProperty[propertyId] += msg.value;
        emit RevenueDeposited(propertyId, distributions[propertyId].length - 1, msg.value, revenuePerShare, totalShares);
    }

    function claimRevenue(uint256 propertyId, uint256 distributionIndex) public nonReentrant whenNotPaused {
        if (distributionIndex >= distributions[propertyId].length) revert InvalidPropertyId();
        if (claimed[msg.sender][propertyId][distributionIndex]) revert AlreadyClaimed();

        Distribution memory distribution = distributions[propertyId][distributionIndex];
        uint256 userShares = propertyToken.balanceOf(msg.sender, propertyId);
        if (userShares == 0) revert NoShares();

        uint256 claimAmount = (userShares * distribution.revenuePerShare) / SCALE_FACTOR;
        if (claimAmount == 0) revert NothingToClaim();

        claimed[msg.sender][propertyId][distributionIndex] = true;
        totalClaimedByUser[msg.sender] += claimAmount;

        (bool success, ) = payable(msg.sender).call{value: claimAmount}("");
        if (!success) revert TransferFailed();

        emit RevenueClaimed(msg.sender, propertyId, distributionIndex, claimAmount);
    }

    function claimAllRevenue(uint256 propertyId) external nonReentrant whenNotPaused {
        uint256 totalClaimable = 0;
        uint256 distributionsProcessed = 0;
        uint256 distributionCount = distributions[propertyId].length;
        uint256 userShares = propertyToken.balanceOf(msg.sender, propertyId);
        if (userShares == 0) revert NoShares();

        for (uint256 i = 0; i < distributionCount; i++) {
            if (!claimed[msg.sender][propertyId][i]) {
                Distribution memory distribution = distributions[propertyId][i];
                uint256 claimAmount = (userShares * distribution.revenuePerShare) / SCALE_FACTOR;
                if (claimAmount > 0) {
                    claimed[msg.sender][propertyId][i] = true;
                    totalClaimable += claimAmount;
                    distributionsProcessed++;
                }
            }
        }

        if (totalClaimable == 0) revert NothingToClaim();
        totalClaimedByUser[msg.sender] += totalClaimable;

        (bool success, ) = payable(msg.sender).call{value: totalClaimable}("");
        if (!success) revert TransferFailed();

        emit BatchRevenueClaimed(msg.sender, propertyId, totalClaimable, distributionsProcessed);
    }

    function claimMultipleProperties(uint256[] calldata propertyIds) external nonReentrant whenNotPaused {
        uint256 totalClaimable = 0;
        for (uint256 p = 0; p < propertyIds.length; p++) {
            uint256 propertyId = propertyIds[p];
            uint256 userShares = propertyToken.balanceOf(msg.sender, propertyId);
            if (userShares == 0) continue;

            uint256 distributionCount = distributions[propertyId].length;
            for (uint256 i = 0; i < distributionCount; i++) {
                if (!claimed[msg.sender][propertyId][i]) {
                    Distribution memory distribution = distributions[propertyId][i];
                    uint256 claimAmount = (userShares * distribution.revenuePerShare) / SCALE_FACTOR;
                    if (claimAmount > 0) {
                        claimed[msg.sender][propertyId][i] = true;
                        totalClaimable += claimAmount;
                    }
                }
            }
        }

        if (totalClaimable == 0) revert NothingToClaim();
        totalClaimedByUser[msg.sender] += totalClaimable;

        (bool success, ) = payable(msg.sender).call{value: totalClaimable}("");
        if (!success) revert TransferFailed();
    }

    function getClaimableRevenue(address user, uint256 propertyId) external view returns (uint256 totalClaimable) {
        uint256 userShares = propertyToken.balanceOf(user, propertyId);
        if (userShares == 0) return 0;

        uint256 distributionCount = distributions[propertyId].length;
        for (uint256 i = 0; i < distributionCount; i++) {
            if (!claimed[user][propertyId][i]) {
                Distribution memory distribution = distributions[propertyId][i];
                uint256 claimAmount = (userShares * distribution.revenuePerShare) / SCALE_FACTOR;
                totalClaimable += claimAmount;
            }
        }
    }

    function getClaimableRevenueMultiple(address user, uint256[] calldata propertyIds) external view returns (uint256 totalClaimable) {
        for (uint256 p = 0; p < propertyIds.length; p++) {
            uint256 propertyId = propertyIds[p];
            uint256 userShares = propertyToken.balanceOf(user, propertyId);
            if (userShares == 0) continue;

            uint256 distributionCount = distributions[propertyId].length;
            for (uint256 i = 0; i < distributionCount; i++) {
                if (!claimed[user][propertyId][i]) {
                    Distribution memory distribution = distributions[propertyId][i];
                    uint256 claimAmount = (userShares * distribution.revenuePerShare) / SCALE_FACTOR;
                    totalClaimable += claimAmount;
                }
            }
        }
    }

    function getDistributionHistory(uint256 propertyId) external view returns (Distribution[] memory) {
        return distributions[propertyId];
    }

    function getDistributionCount(uint256 propertyId) external view returns (uint256) {
        return distributions[propertyId].length;
    }

    function hasClaimed(address user, uint256 propertyId, uint256 distributionIndex) external view returns (bool) {
        return claimed[user][propertyId][distributionIndex];
    }

    function emergencyWithdraw(uint256 amount, address payable recipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (recipient == address(0)) revert InvalidPropertyToken();
        if (amount == 0 || amount > address(this).balance) revert InvalidAmount();
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    receive() external payable {}
}

interface IERC1155Supply {
    function totalSupply(uint256 id) external view returns (uint256);
}
