// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RevenueDistribution
 * @dev Automated distribution of rental income to fractional property owners
 * @notice Distributes revenue proportionally based on share ownership
 */
contract RevenueDistribution is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC1155 public propertyToken;

    struct RevenuePool {
        uint256 totalRevenue;           // Total revenue ever deposited
        uint256 distributedRevenue;     // Total revenue distributed
        uint256 pendingRevenue;         // Revenue ready to distribute
        uint256 lastDistribution;       // Timestamp of last distribution
        uint256 totalShares;            // Total shares at snapshot
        uint256 revenuePerShare;        // Revenue per share (scaled by 1e18)
        bool isActive;
    }

    struct UserClaim {
        uint256 lastClaimedRevenue;     // Last revenue per share claimed
        uint256 pendingClaim;           // Pending amount to claim
        uint256 totalClaimed;           // Total claimed by user
    }

    // PropertyId => RevenuePool
    mapping(uint256 => RevenuePool) public revenuePools;
    
    // PropertyId => User => UserClaim
    mapping(uint256 => mapping(address => UserClaim)) public userClaims;
    
    // Platform-wide statistics
    uint256 public totalRevenueProcessed;
    uint256 public totalRevenueClaimed;
    
    // Minimum distribution interval (e.g., 30 days)
    uint256 public constant MIN_DISTRIBUTION_INTERVAL = 30 days;

    event RevenueDeposited(
        uint256 indexed propertyId,
        uint256 amount,
        address indexed depositor
    );

    event RevenueDistributed(
        uint256 indexed propertyId,
        uint256 amount,
        uint256 totalShares,
        uint256 revenuePerShare
    );

    event RevenueClaimed(
        uint256 indexed propertyId,
        address indexed user,
        uint256 amount
    );

    event EmergencyWithdrawal(
        uint256 indexed propertyId,
        uint256 amount,
        address indexed recipient
    );

    constructor(address _propertyToken) {
        require(_propertyToken != address(0), "Invalid property token address");
        
        propertyToken = IERC1155(_propertyToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(DEPOSITOR_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @dev Deposit rental income for a property
     * @param _propertyId ID of the property
     */
    function depositRevenue(uint256 _propertyId)
        external
        payable
        onlyRole(DEPOSITOR_ROLE)
        whenNotPaused
    {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        
        RevenuePool storage pool = revenuePools[_propertyId];
        
        pool.totalRevenue += msg.value;
        pool.pendingRevenue += msg.value;
        pool.isActive = true;
        
        totalRevenueProcessed += msg.value;

        emit RevenueDeposited(_propertyId, msg.value, msg.sender);
    }

    /**
     * @dev Distribute pending revenue to all shareholders
     * @param _propertyId ID of the property
     */
    function distributeRevenue(uint256 _propertyId)
        external
        onlyRole(DISTRIBUTOR_ROLE)
        whenNotPaused
        nonReentrant
    {
        RevenuePool storage pool = revenuePools[_propertyId];
        
        require(pool.isActive, "Revenue pool not active");
        require(pool.pendingRevenue > 0, "No pending revenue to distribute");
        require(
            block.timestamp >= pool.lastDistribution + MIN_DISTRIBUTION_INTERVAL,
            "Distribution interval not met"
        );

        // Get total supply of property tokens
        // Note: This is a simplified approach. In production, you'd need to track
        // total shares from the PropertyToken contract
        uint256 totalShares = pool.totalShares;
        require(totalShares > 0, "No shares exist");

        // Calculate revenue per share (scaled by 1e18 for precision)
        uint256 revenuePerShare = (pool.pendingRevenue * 1e18) / totalShares;
        
        pool.revenuePerShare += revenuePerShare;
        pool.distributedRevenue += pool.pendingRevenue;
        pool.lastDistribution = block.timestamp;
        
        uint256 distributed = pool.pendingRevenue;
        pool.pendingRevenue = 0;

        emit RevenueDistributed(_propertyId, distributed, totalShares, revenuePerShare);
    }

    /**
     * @dev Claim accumulated revenue for a specific property
     * @param _propertyId ID of the property
     */
    function claimRevenue(uint256 _propertyId)
        external
        whenNotPaused
        nonReentrant
    {
        uint256 claimable = getClaimableAmount(msg.sender, _propertyId);
        require(claimable > 0, "No revenue to claim");

        UserClaim storage userClaim = userClaims[_propertyId][msg.sender];
        RevenuePool storage pool = revenuePools[_propertyId];
        
        // Update user's claim record
        userClaim.lastClaimedRevenue = pool.revenuePerShare;
        userClaim.totalClaimed += claimable;
        
        totalRevenueClaimed += claimable;

        // Transfer revenue to user
        payable(msg.sender).transfer(claimable);

        emit RevenueClaimed(_propertyId, msg.sender, claimable);
    }

    /**
     * @dev Claim revenue from multiple properties at once
     * @param _propertyIds Array of property IDs
     */
    function claimMultipleProperties(uint256[] calldata _propertyIds)
        external
        whenNotPaused
        nonReentrant
    {
        uint256 totalClaim = 0;
        
        for (uint256 i = 0; i < _propertyIds.length; i++) {
            uint256 propertyId = _propertyIds[i];
            uint256 claimable = getClaimableAmount(msg.sender, propertyId);
            
            if (claimable > 0) {
                UserClaim storage userClaim = userClaims[propertyId][msg.sender];
                RevenuePool storage pool = revenuePools[propertyId];
                
                userClaim.lastClaimedRevenue = pool.revenuePerShare;
                userClaim.totalClaimed += claimable;
                totalClaim += claimable;
                
                emit RevenueClaimed(propertyId, msg.sender, claimable);
            }
        }
        
        require(totalClaim > 0, "No revenue to claim");
        totalRevenueClaimed += totalClaim;
        
        payable(msg.sender).transfer(totalClaim);
    }

    /**
     * @dev Calculate claimable amount for a user
     * @param _user Address of the user
     * @param _propertyId ID of the property
     * @return Claimable amount in wei
     */
    function getClaimableAmount(address _user, uint256 _propertyId)
        public
        view
        returns (uint256)
    {
        RevenuePool storage pool = revenuePools[_propertyId];
        UserClaim storage userClaim = userClaims[_propertyId][_user];
        
        if (!pool.isActive || pool.revenuePerShare == 0) {
            return 0;
        }

        // Get user's current share balance
        uint256 userShares = propertyToken.balanceOf(_user, _propertyId);
        
        if (userShares == 0) {
            return 0;
        }

        // Calculate accumulated revenue since last claim
        uint256 revenuePerShareDelta = pool.revenuePerShare - userClaim.lastClaimedRevenue;
        uint256 accumulated = (userShares * revenuePerShareDelta) / 1e18;

        return accumulated;
    }

    /**
     * @dev Get total earnings for a user across all properties
     * @param _user Address of the user
     * @param _propertyIds Array of property IDs to check
     * @return Total earnings
     */
    function getTotalEarnings(address _user, uint256[] calldata _propertyIds)
        external
        view
        returns (uint256)
    {
        uint256 total = 0;
        
        for (uint256 i = 0; i < _propertyIds.length; i++) {
            UserClaim storage userClaim = userClaims[_propertyIds[i]][_user];
            total += userClaim.totalClaimed;
            total += getClaimableAmount(_user, _propertyIds[i]);
        }
        
        return total;
    }

    /**
     * @dev Initialize revenue pool for a property (admin only)
     * @param _propertyId ID of the property
     * @param _totalShares Total shares for the property
     */
    function initializeRevenuePool(uint256 _propertyId, uint256 _totalShares)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(_totalShares > 0, "Total shares must be greater than zero");
        require(!revenuePools[_propertyId].isActive, "Pool already initialized");
        
        revenuePools[_propertyId] = RevenuePool({
            totalRevenue: 0,
            distributedRevenue: 0,
            pendingRevenue: 0,
            lastDistribution: block.timestamp,
            totalShares: _totalShares,
            revenuePerShare: 0,
            isActive: true
        });
    }

    /**
     * @dev Update total shares for a property (when shares are minted/burned)
     * @param _propertyId ID of the property
     * @param _newTotalShares New total shares
     */
    function updateTotalShares(uint256 _propertyId, uint256 _newTotalShares)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(_newTotalShares > 0, "Total shares must be greater than zero");
        
        RevenuePool storage pool = revenuePools[_propertyId];
        require(pool.isActive, "Pool not initialized");
        
        pool.totalShares = _newTotalShares;
    }

    /**
     * @dev Emergency withdrawal (admin only, use with extreme caution)
     * @param _propertyId ID of the property
     * @param _recipient Address to receive funds
     */
    function emergencyWithdraw(uint256 _propertyId, address _recipient)
        external
        onlyRole(ADMIN_ROLE)
        nonReentrant
    {
        require(_recipient != address(0), "Invalid recipient");
        
        RevenuePool storage pool = revenuePools[_propertyId];
        uint256 amount = pool.pendingRevenue;
        
        require(amount > 0, "No pending revenue");
        
        pool.pendingRevenue = 0;
        payable(_recipient).transfer(amount);

        emit EmergencyWithdrawal(_propertyId, amount, _recipient);
    }

    /**
     * @dev Get revenue pool details
     * @param _propertyId ID of the property
     */
    function getRevenuePool(uint256 _propertyId)
        external
        view
        returns (
            uint256 totalRevenue,
            uint256 distributedRevenue,
            uint256 pendingRevenue,
            uint256 lastDistribution,
            uint256 totalShares,
            uint256 revenuePerShare,
            bool isActive
        )
    {
        RevenuePool storage pool = revenuePools[_propertyId];
        return (
            pool.totalRevenue,
            pool.distributedRevenue,
            pool.pendingRevenue,
            pool.lastDistribution,
            pool.totalShares,
            pool.revenuePerShare,
            pool.isActive
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Fallback function to receive ETH
     */
    receive() external payable {
        revert("Use depositRevenue function");
    }
}
