// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RevenueDistribution
 * @dev Pull-based revenue distribution for ERC-1155 property tokens.
 *
 * Uses a "cumulative revenue per unit" index per tokenId to avoid per-investor loops.
 * This example uses native ETH for simplicity; you can swap to ERC20.
 */

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PropertyToken.sol";

contract RevenueDistribution is AccessControl, ReentrancyGuard {
    bytes32 public constant REVENUE_MANAGER_ROLE = keccak256("REVENUE_MANAGER_ROLE");

    PropertyToken public immutable propertyToken;

    // tokenId => cumulative revenue per unit (scaled by 1e18)
    mapping(uint256 => uint256) public cumulativeRevenuePerUnit;

    // tokenId => user => amount of revenue index already credited
    mapping(uint256 => mapping(address => uint256)) public userIndex;

    event RevenueDeposited(uint256 indexed tokenId, uint256 amount, uint256 newIndex);
    event RevenueClaimed(uint256 indexed tokenId, address indexed user, uint256 amount);

    constructor(address _propertyToken, address admin) {
        propertyToken = PropertyToken(_propertyToken);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REVENUE_MANAGER_ROLE, admin);
    }

    /**
     * @dev Deposit revenue for a given property (tokenId).
     * msg.value is the amount of ETH to distribute.
     */
    function depositRevenue(uint256 tokenId) external payable onlyRole(REVENUE_MANAGER_ROLE) {
        uint256 amount = msg.value;
        require(amount > 0, "No value sent");

        uint256 supply = propertyToken.totalSupply(tokenId);
        require(supply > 0, "No supply for token");

        uint256 delta = (amount * 1e18) / supply;
        cumulativeRevenuePerUnit[tokenId] += delta;

        emit RevenueDeposited(tokenId, amount, cumulativeRevenuePerUnit[tokenId]);
    }

    /**
     * @dev Claim revenue for a single property.
     */
    function claim(uint256 tokenId) public nonReentrant {
        uint256 holderBalance = propertyToken.balanceOf(msg.sender, tokenId);
        require(holderBalance > 0, "No balance");

        uint256 currentIndex = cumulativeRevenuePerUnit[tokenId];
        uint256 userLastIndex = userIndex[tokenId][msg.sender];

        uint256 indexDelta = currentIndex - userLastIndex;
        if (indexDelta == 0) {
            return; // nothing to claim
        }

        uint256 amountOwed = (holderBalance * indexDelta) / 1e18;
        require(amountOwed > 0, "Nothing owed");

        userIndex[tokenId][msg.sender] = currentIndex;

        (bool ok, ) = msg.sender.call{value: amountOwed}("");
        require(ok, "ETH transfer failed");

        emit RevenueClaimed(tokenId, msg.sender, amountOwed);
    }

    /**
     * @dev Batch claim for multiple properties.
     */
    function claimBatch(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            claim(tokenIds[i]);
        }
    }

    /**
     * @dev View helper: compute claimable without changing state.
     */
    function claimable(uint256 tokenId, address account) external view returns (uint256) {
        uint256 balance = propertyToken.balanceOf(account, tokenId);
        if (balance == 0) return 0;

        uint256 currentIndex = cumulativeRevenuePerUnit[tokenId];
        uint256 userLastIndex = userIndex[tokenId][account];

        uint256 indexDelta = currentIndex - userLastIndex;
        return (balance * indexDelta) / 1e18;
    }
}
